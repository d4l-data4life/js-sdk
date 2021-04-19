/* eslint-disable no-param-reassign, no-await-in-loop */
import { convertBlobToArrayBufferView } from 'js-crypto';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import isNull from 'lodash/isNull';
import map from 'lodash/map';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import omit from 'lodash/omit';
import reject from 'lodash/reject';
import some from 'lodash/some';
import {
  FULL,
  getAttachmentIdToDownload,
  getContentHash,
  getEncryptedFilesByAttachmentIndex,
  getFileContentsAsBuffer,
  getIdentifierValue,
  hasAttachments,
  separateOldAndNewAttachments,
  shrinkImageHeightIfNeeded,
  verifyAttachmentPayload,
} from '../lib/attachmentUtils';
import BlobFile from '../lib/BlobFile';
import InvalidAttachmentPayloadError from '../lib/errors/InvalidAttachmentPayloadError';
import ValidationError from '../lib/errors/ValidationError';
import fhirValidator from '../lib/fhirValidator';
import {
  isAllowedByteSequence,
  isAllowedFileType,
  isResizableImageByteSequence,
  isWithinSizeLimit,
} from '../lib/fileValidator';
import Attachment from '../lib/models/fhir/Attachment';
import { DOCUMENT_REFERENCE } from '../lib/models/fhir/DocumentReference';
import taggingUtils, { tagKeys } from '../lib/taggingUtils';
import documentRoutes from '../routes/documentRoutes';
import createCryptoService from './createCryptoService';
import recordService from './recordService';
import { DecryptedFhirRecord, FetchResponse, Params, Record } from './types';

type IAttachment = {
  isImage?: boolean;
  hasPreview?: boolean;
  hasThumb?: boolean;
  id?: string;
};

const SUPPORTED_PARAMS = [
  'limit',
  'offset',
  'start_date',
  'end_date',
  'fhirVersion',
  'tags',
  'exclude_tags',
  'exclude_flags',
  'annotations',
  'resourceType',
  'partner',
];

// TODO: Add return Type
export const getCleanAttachmentsFromResource = (resource: any): any[] => {
  const { resourceType } = resource;

  let attachments;
  if (resourceType === 'DocumentReference') {
    attachments = map(resource.content, 'attachment');
  }
  if (resourceType === 'Patient' || resourceType === 'Practitioner') {
    attachments = cloneDeep(resource.photo);
  }
  if (resourceType === 'Medication') {
    attachments = cloneDeep(resource.image);
  }
  if (resourceType === 'DiagnosticReport') {
    attachments = cloneDeep(resource.presentedForm);
  }
  if (resourceType === 'Observation') {
    const components = [...(resource.component || [])];
    attachments = reject(
      [
        ...[resource.valueAttachment || []],
        // @ts-ignore
        ...map(components, 'valueAttachment'),
      ],
      isEmpty
    );
  }
  if (resourceType === 'Questionnaire') {
    const initialAttachments = map(resource.item, 'initialAttachment');
    attachments = initialAttachments.length ? reject(initialAttachments, isEmpty) : [];
  }

  if (resourceType === 'QuestionnaireResponse') {
    const answers = flatMap(resource.item, 'answer');
    attachments = answers.length ? reject(map(answers, 'valueAttachment'), isEmpty) : [];
  }

  if (!attachments || !attachments.length) {
    return [];
  }

  return attachments.map((attachment: any) => {
    if (attachment.originalSize && attachment.originalHash) {
      attachment.size = attachment.originalSize;
      delete attachment.originalSize;
      attachment.hash = attachment.originalHash;
      delete attachment.originalHash;
    }
    return attachment;
  });
};

export const setAttachmentsToResource = (
  resourceWithoutAttachments: fhir.DomainResource,
  attachments: Attachment[]
): fhir.DomainResource => {
  const resource = cloneDeep(resourceWithoutAttachments);
  const { resourceType } = resource;

  if (resourceType === 'DocumentReference') {
    (resource as fhir.DocumentReference).content = attachments.map(attachment => ({ attachment }));
  }
  if (resourceType === 'Patient') {
    (resource as fhir.Patient).photo = [...attachments];
  }
  if (resourceType === 'Practitioner') {
    (resource as fhir.Practitioner).photo = [...attachments];
  }
  if (resourceType === 'Medication') {
    (resource as fhir.Medication).image = [...attachments];
  }
  if (resourceType === 'DiagnosticReport') {
    (resource as fhir.DiagnosticReport).presentedForm = [...attachments];
  }

  if (resourceType === 'Observation') {
    const components = (resource as fhir.Observation).component;
    if (components && components.length) {
      components.forEach(component => {
        if (!isEmpty(component.valueAttachment)) {
          const { hash = null, id = null } = component.valueAttachment;
          const matchByHash = find(attachments, { hash });
          const matchById = find(attachments, { id });
          if (matchByHash && !matchById) {
            component.valueAttachment = matchByHash;
          }
        }
      });
    }
  }
  if (resourceType === 'Questionnaire') {
    const items = (resource as fhir.Questionnaire).item;
    if (items && items.length) {
      items.forEach(item => {
        if (!isEmpty(item.initialAttachment)) {
          const { hash = null, id = null } = item.initialAttachment;
          const matchByHash = find(attachments, { hash });
          const matchById = find(attachments, { id });
          if (matchByHash && !matchById) {
            item.initialAttachment = matchByHash;
          }
        }
      });
    }
  }

  /*
   * This one is a little more tricky because of the deep nesting.
   *
   * Essentially what we do is find a content (hash) match in
   * item.answer.valueAttachment, and if it has id declare it as old
   *
   * */
  if (resourceType === 'QuestionnaireResponse') {
    const items = (resource as fhir.QuestionnaireResponse).item;
    if (items && items.length) {
      items.forEach(item => {
        const answers = item.answer;
        if (answers && answers.length) {
          answers.forEach(answer => {
            if (!isEmpty(answer.valueAttachment)) {
              const { hash = null, id = null } = answer.valueAttachment;
              const matchByHash = find(attachments, { hash });
              const matchById = find(attachments, { id });
              if (matchByHash && !matchById) {
                answer.valueAttachment = matchByHash;
              }
            }
          });
        }
      });
    }
  }

  return resource;
};

const addPreviewsToAttachments = async vanillaAttachments => {
  const blobs = [];
  const attachmentsWithPreviews = cloneDeep(vanillaAttachments);
  // why are we not using a .map or .forEach?
  // Because they are not executed in the expected manner with async functions/promises
  // eslint-disable-next-line no-restricted-syntax
  for (const attachment of attachmentsWithPreviews) {
    const { file, title } = attachment;
    if (!isWithinSizeLimit(file)) {
      throw new Error('File is too large.');
    }

    if (!(await isAllowedFileType(file))) {
      throw new Error('Tried to uploaded unsupported file type');
    }

    const content = await getFileContentsAsBuffer(file);
    blobs.push(file);

    if (isResizableImageByteSequence(new Uint8Array(content as ArrayBuffer))) {
      Object.assign(attachment, {
        isImage: true,
        hasThumb: false,
        hasPreview: false,
      });

      const thumb = await shrinkImageHeightIfNeeded(title, file, 200);
      if (!isNull(thumb)) {
        // this is nested here because if there's no thumb, the image is <= 200px
        // in which case there will definitely not be a dedicated preview either.
        const preview = await shrinkImageHeightIfNeeded(title, file, 1000);
        if (!isNull(preview)) {
          attachment.hasPreview = true;
          blobs.push(preview);
        }

        attachment.hasThumb = true;
        blobs.push(thumb);
      }
    }
  }
  return [blobs, attachmentsWithPreviews];
};

const uploadAttachments = (ownerId, encryptedFiles) =>
  Promise.all(encryptedFiles.map(file => documentRoutes.uploadDocument(ownerId, file)));

export const cleanResource = (fhirResource: fhir.DomainResource) => {
  if (fhirResource.resourceType === DOCUMENT_REFERENCE) {
    // @ts-ignore
    if (fhirResource.content) {
      const clonedResource = cloneDeep(fhirResource);
      // @ts-ignore
      clonedResource.content = fhirResource.content.map(value => omit(value, 'attachment.file'));
      return clonedResource;
    }
  }

  return fhirResource;
};

export const attachBlobs = ({
  encryptedFiles,
  ownerId,
  oldAttachments = [],
  newAttachments,
  resource,
}: {
  encryptedFiles: Uint8Array[];
  ownerId: string;
  oldAttachments: File[];
  newAttachments: IAttachment[];
  resource: fhir.DomainResource;
}) => {
  const uploadPromises = newAttachments.map((_, index) =>
    uploadAttachments(
      ownerId,
      getEncryptedFilesByAttachmentIndex(encryptedFiles, newAttachments, index)
    )
  );

  return Promise.all(uploadPromises).then(uploadInformation => {
    // @ts-ignore
    const identifier = resource.identifier || [];
    newAttachments.forEach((attachment, attachmentIndex) => {
      // @ts-ignore
      attachment.id = uploadInformation[attachmentIndex][0].document_id;
      identifier.push(getIdentifierValue(uploadInformation[attachmentIndex]));
    });

    const attachments = [
      ...oldAttachments,
      ...map(newAttachments, item => omit(item, ['isImage', 'hasPreview', 'hasThumb'])),
    ];

    const attachmentsWithoutFiles = map(attachments, item => omit(item, 'file'));

    const returnResource = setAttachmentsToResource(resource, attachments as Attachment[]);
    const resourceWithAttachments = setAttachmentsToResource(
      resource,
      attachmentsWithoutFiles as Attachment[]
    );

    // @ts-ignore
    resourceWithAttachments.identifier = identifier;
    // @ts-ignore
    returnResource.identifier = identifier;

    return [resourceWithAttachments, returnResource];
  });
};

export const prepareSearchParameters = ({
  params,
  fallbackMode = null,
}: {
  params: Params;
  fallbackMode?: null | 'fhirversion' | 'annotation';
}) => {
  const parameters = { ...params };
  if (!Object.keys(parameters).every(key => includes(SUPPORTED_PARAMS, key))) {
    throw new Error(
      `Passed unsupported parameter. Supported parameters are ${SUPPORTED_PARAMS.join(', ')}`
    );
  }
  delete parameters.fhirVersion;

  parameters.tags = parameters.tags || [];
  if (params.resourceType) {
    parameters.tags.push(taggingUtils.buildTag(tagKeys.resourceType, params.resourceType));
    delete parameters.resourceType;
  }
  if (params.partner) {
    parameters.tags.push(taggingUtils.buildTag(tagKeys.partner, params.partner));
    delete parameters.partner;
  }

  if (params.annotations) {
    parameters.tags.push(
      ...taggingUtils.generateCustomTags(params.annotations, fallbackMode === 'annotation')
    );
    delete parameters.annotations;
  }

  if (params.exclude_tags) {
    parameters.exclude_tags = taggingUtils.generateCustomTags(
      params.exclude_tags,
      fallbackMode === 'annotation'
    );
  }

  if (params.fhirVersion) {
    if (fallbackMode === 'fhirversion') {
      parameters.tags.push(taggingUtils.buildFallbackTag(tagKeys.fhirVersion, params.fhirVersion));
    } else {
      parameters.tags.push(taggingUtils.buildTag(tagKeys.fhirVersion, params.fhirVersion));
    }
    delete parameters.fhirVersion;
  }

  if (params.exclude_flags) {
    parameters.exclude_tags = [
      ...new Set([...(parameters.exclude_tags || []), ...params.exclude_flags]),
    ];
    delete parameters.exclude_flags;
  }

  return parameters;
};

const convertToExposedRecord = (decryptedRecord: DecryptedFhirRecord) => {
  const exposedRecord = {
    annotations: taggingUtils.getAnnotations(decryptedRecord.tags),
    customCreationDate: decryptedRecord.customCreationDate,
    fhirResource: decryptedRecord.fhirResource,
    id: decryptedRecord.id,
    partner: taggingUtils.getTagValueFromList(decryptedRecord.tags, tagKeys.partner),
    updatedDate: decryptedRecord.updatedDate,
  };
  exposedRecord.fhirResource.id = decryptedRecord.id;
  return exposedRecord;
};

const fhirService = {
  setFhirVersion(fhirVersion: string): void {
    this.fhirVersion = fhirVersion;
  },
  getFhirVersion(): string {
    return this.fhirVersion;
  },
  async createResource(
    ownerId: string,
    fhirResource: fhir.DomainResource,
    date: Date = new Date(),
    annotations: string[] = []
  ): Promise<Record> {
    let validationResult;
    try {
      validationResult = await fhirValidator.validate(cleanResource(fhirResource));
    } catch (e) {
      return Promise.reject(new ValidationError(e));
    }

    if (validationResult === false) {
      // seems redundant, but eslint does not like return in finally
      return Promise.reject(
        new ValidationError('Called createResource with an invalid fhirResource parameter.')
      );
    }

    let attachmentKey;
    let returnFHIRResource;
    let resource;
    if (hasAttachments(fhirResource)) {
      [resource, returnFHIRResource, attachmentKey] = await this.handleAttachments(
        ownerId,
        fhirResource
      );
    }

    return recordService
      .createRecord(ownerId, {
        attachmentKey,
        fhirResource: cleanResource(resource || fhirResource),
        customCreationDate: date,
        tags: [
          ...taggingUtils.generateCustomTags(annotations),
          taggingUtils.generateFhirVersionTag(),
        ],
      })
      .then(originalRecord => ({
        ...originalRecord,
        fhirResource: returnFHIRResource || originalRecord.fhirResource,
      }))
      .then(convertToExposedRecord)
      .catch(() => {
        return Promise.reject(new Error('Creating the Record failed'));
      });
  },

  async handleAttachments(ownerId: string, resource: fhir.DomainResource) {
    const attachments = getCleanAttachmentsFromResource(resource);
    const attachmentFiles = map(attachments, 'file');

    // @ts-ignore
    return Promise.all(attachmentFiles.map(getContentHash))
      .then(async hashes => {
        const metaInformation = mergeWith(hashes, attachments, (hash, attachmentFile) => ({
          hash,
          size: attachmentFile.file.size,
        }));

        const newAttachments = merge(attachments, metaInformation);
        const [blobs, newAttachmentsWithPreviews] = await addPreviewsToAttachments(newAttachments);

        const [encryptedFiles, updatedKeyInfo] = await createCryptoService(ownerId).encryptBlobs(
          blobs
        );

        const [originalResource, returnResource] = await attachBlobs({
          ownerId,
          resource,
          newAttachments: newAttachmentsWithPreviews,
          oldAttachments: [],
          encryptedFiles: encryptedFiles as Uint8Array[],
        });
        return [originalResource, returnResource, updatedKeyInfo];
      })
      .catch(() => {
        return Promise.reject(new Error('Creating the Resource failed'));
      });
  },

  async updateResource(
    ownerId: string,
    fhirResource: fhir.DomainResource,
    date: Date,
    annotations?: string[]
  ): Promise<Record> {
    let validationResult;
    try {
      validationResult = await fhirValidator.validate(cleanResource(cloneDeep(fhirResource)));
    } catch (e) {
      return Promise.reject(new ValidationError(e));
    }

    if (validationResult === false) {
      // seems redundant, but eslint does not like return in finally
      return Promise.reject(
        new ValidationError('Called updateResource with an invalid fhirResource parameter.')
      );
    }

    if (!fhirResource.id) {
      return Promise.reject(new ValidationError('No parameter id found in resource to update'));
    }

    let attachmentKey;
    let resource;
    let returnResource;

    if (hasAttachments(fhirResource)) {
      [attachmentKey, resource, returnResource] = await this.updateAttachments(
        ownerId,
        fhirResource as fhir.DomainResource,
        annotations
      );
    }

    let tags;
    if (annotations) {
      tags = annotations.length ? taggingUtils.generateCustomTags(annotations) : [];
    }

    return recordService
      .updateRecord(ownerId, {
        attachmentKey,
        fhirResource: cleanResource(resource || fhirResource),
        id: fhirResource.id,
        tags,
        customCreationDate: date,
      })
      .then(convertToExposedRecord)
      .then(record => ({
        ...record,
        fhirResource: returnResource || record.fhirResource,
      }));
  },

  updateAttachments(ownerId: string, resource: fhir.DomainResource, annotations: string[]) {
    return recordService
      .downloadRecord(ownerId, resource.id)
      .then((previousRecord: DecryptedFhirRecord) => {
        const previousResource = previousRecord.fhirResource;
        const previousAttachments = getCleanAttachmentsFromResource(previousResource);

        const currentAttachments = getCleanAttachmentsFromResource(resource);
        const currentAttachmentFiles = map(currentAttachments, 'file');

        const notAllFilesDownloaded = some(currentAttachmentFiles, file => !(file instanceof File));

        const isTagUpdateWithoutAttachmentContent =
          notAllFilesDownloaded && previousAttachments.length === currentAttachments.length;

        if (isTagUpdateWithoutAttachmentContent && annotations.length > 0) {
          const returnResource = cloneDeep(resource);
          const attachmentsWithoutFiles = map(
            getCleanAttachmentsFromResource(resource),
            attachment => omit(attachment, 'file')
          );
          setAttachmentsToResource(resource, attachmentsWithoutFiles as Attachment[]);

          return [previousRecord.attachmentKey, resource, returnResource];
        }

        return Promise.all(currentAttachmentFiles.map(getContentHash))
          .then(async hashes => {
            const metaInformation = mergeWith(
              hashes,
              currentAttachments,
              (hash, attachmentFile) => ({
                hash,
                size: attachmentFile.file.size,
              })
            );

            const currentAttachmentsWithMeta = merge(currentAttachments, metaInformation);
            const [oldAttachments, newAttachments] = separateOldAndNewAttachments(
              currentAttachmentsWithMeta,
              previousAttachments
            );

            const [blobs, newAttachmentsWithPreviews] = await addPreviewsToAttachments(
              newAttachments
            );

            const [encryptedFiles, updatedKeyInfo] = await createCryptoService(
              ownerId
            ).encryptBlobs(blobs, previousRecord.attachmentKey);

            // @ts-ignore
            resource.identifier = previousResource.identifier;

            const [originalResource, returnResource] = await attachBlobs({
              ownerId,
              oldAttachments,
              // @ts-ignore
              resource,
              newAttachments: newAttachmentsWithPreviews,
              encryptedFiles: encryptedFiles as Uint8Array[],
            });

            return [updatedKeyInfo, originalResource, returnResource];
          })
          .catch(() => {
            return Promise.reject(new Error('Updating the Resource failed'));
          });
      });
  },

  fetchResource(ownerId: string, resourceId: string): Promise<Record> {
    return recordService.downloadRecord(ownerId, resourceId).then(convertToExposedRecord);
  },

  deleteResource(ownerId: string, resourceId: string): Promise<void> {
    return recordService.deleteRecord(ownerId, resourceId);
  },

  countResources(ownerId: string, params: Params = {}): Promise<number> {
    return recordService
      .searchWithFallbackIfNeeded(ownerId, true, params)
      .then((responseArray: { totalCount: string }[]) =>
        responseArray.reduce(
          (sum, currentResponse) => sum + parseInt(currentResponse.totalCount, 10),
          0
        )
      );
  },

  fetchResources(ownerId: string, params: Params = {}): Promise<FetchResponse<Record>> {
    return recordService
      .searchWithFallbackIfNeeded(ownerId, false, params)
      .then((responseArray: { totalCount: string; records: DecryptedFhirRecord[] }[]) =>
        recordService.normalizeFallbackSearchResults({
          responseArray,
          conversionFunction: convertToExposedRecord,
        })
      );
  },

  downloadResource(
    ownerId: string,
    resourceId: string,
    options = { imageSize: FULL }
  ): Promise<Record> {
    let record;
    let resource;
    let encryptedAttachmentKey;

    return recordService
      .downloadRecord(ownerId, resourceId)
      .then((rec: DecryptedFhirRecord) => {
        record = { ...rec };

        resource = record.fhirResource;
        encryptedAttachmentKey = record.attachmentKey;

        const attachments = getCleanAttachmentsFromResource(resource);
        const { identifier } = resource;

        return Promise.all(
          attachments.map(attachment => {
            const attachmentIdToDownload = getAttachmentIdToDownload(
              identifier,
              options,
              attachment
            );
            return documentRoutes
              .downloadDocument(ownerId, attachmentIdToDownload)
              .then(convertBlobToArrayBufferView);
          })
        );
      })
      .then(encryptedData =>
        Promise.all(
          encryptedData.map((data: Uint8Array) =>
            createCryptoService(ownerId).decryptData(encryptedAttachmentKey, data)
          )
        )
      )
      .then(dataArray =>
        dataArray.reduce(async (attachmentArrayPromise: any[] | Promise<any>, data) => {
          const attachmentArray = await attachmentArrayPromise;
          const attachment = getCleanAttachmentsFromResource(resource)[attachmentArray.length];
          const file = BlobFile([data], attachment.title, {
            type: attachment.contentType,
          });

          const { identifier } = resource;
          const attachmentId = getAttachmentIdToDownload(identifier, options, attachment);
          const downloadedFullSizeAttachment = attachmentId === attachment.id;

          const isLegitAttachmentPayload =
            isAllowedByteSequence(data) &&
            (await verifyAttachmentPayload(attachment, file, downloadedFullSizeAttachment));

          if (!isLegitAttachmentPayload) {
            return Promise.reject(
              new InvalidAttachmentPayloadError(
                'downloaded file has an invalid or forbidden payload and may be corrupted'
              )
            );
          }

          attachment.file = file;

          if (!downloadedFullSizeAttachment) {
            attachment.originalSize = attachment.size;
            attachment.originalHash = attachment.hash;
            attachment.size = file.size;
            attachment.hash = await getContentHash(file);
          }

          return [...attachmentArray, attachment];
        }, [])
      )
      .then(attachments => {
        resource = setAttachmentsToResource(resource, attachments);
        resource.id = resourceId;
        return {
          ...record,
          fhirResource: resource,
        };
      })
      .then(convertToExposedRecord);
  },
};

export default fhirService;
