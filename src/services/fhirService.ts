/* eslint-disable no-await-in-loop,@typescript-eslint/interface-name-prefix,no-param-reassign */
import {
  convertBlobToArrayBufferView,
  // @ts-ignore
} from 'js-crypto';

import cloneDeep from 'lodash/cloneDeep';
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
import find from 'lodash/find';

import Attachment from '../lib/models/fhir/Attachment';
import ValidationError from '../lib/errors/ValidationError';
import fhirValidator from '../lib/fhirValidator';
import DocumentReference, { DOCUMENT_REFERENCE } from '../lib/models/fhir/DocumentReference';
import taggingUtils, { tagKeys } from '../lib/taggingUtils';
import {
  isAllowedByteSequence,
  isAllowedFileType,
  isResizableImageByteSequence,
  isWithinSizeLimit,
} from '../lib/fileValidator';

import BlobFile from '../lib/BlobFile';
import {
  shrinkImageHeightIfNeeded,
  getContentHash,
  getEncryptedFilesByAttachmentIndex,
  getFileContentsAsBuffer,
  separateOldAndNewAttachments,
  FULL,
  getIdentifierValue,
  verifyAttachmentPayload,
  hasAttachments,
  getAttachmentIdToDownload,
} from '../lib/attachmentUtils';
import documentRoutes from '../routes/documentRoutes';
import createCryptoService from './createCryptoService';
import recordService, { DecryptedRecord } from './recordService';
import InvalidAttachmentPayloadError from '../lib/errors/InvalidAttachmentPayloadError';

// The exposed search params
interface IParams {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  exclude_tags?: string[];
  exclude_flags?: string[];
  annotations?: string[];
  resourceType?: string;
  partner?: string;
}

/** The record we expose to users should not expose any sensitive information.
 * It implies dataKey, attachmentKey, internal tags used to distinguish fhir resource types,
 * client ids. It should only expose annotations created by the users of SDK.
 * Annotations are treated internally as custom tags by the SDK which can be used for filtering
 * by the users of SDK
 */
interface IRecord {
  id?: string;
  fhirResource: fhir.DomainResource;
  annotations?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  partner?: string;
}

interface AppData {
  id?: string;
  data: any;
  annotations?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  partner?: string;
}
interface IFetchResponse {
  totalCount: number;
  records: IRecord[] | AppData[];
}

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
  // @ts-ignore
  resourceWithoutAttachments: Fhir.DomainResource,
  attachments: Attachment[]
): fhir.DomainResource => {
  const resource = cloneDeep(resourceWithoutAttachments);
  const { resourceType } = resource;

  if (resourceType === 'DocumentReference') {
    resource.content = attachments.map(attachment => ({ attachment }));
  }
  if (resourceType === 'Patient' || resourceType === 'Practitioner') {
    resource.photo = [...attachments];
  }
  if (resourceType === 'Medication') {
    resource.image = [...attachments];
  }
  if (resourceType === 'DiagnosticReport') {
    resource.presentedForm = [...attachments];
  }

  if (resourceType === 'Observation') {
    const components = resource.component;
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
    const items = resource.item;
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
    const items = resource.item;
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

const cleanResource = (fhirResource: fhir.DomainResource) => {
  if (fhirResource.resourceType === DOCUMENT_REFERENCE) {
    // @ts-ignore
    if (fhirResource.content) {
      // @ts-ignore
      fhirResource.content = fhirResource.content.map(value => {
        delete value.attachment.file;
        return value;
      });
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
    // eslint-disable-next-line max-nested-callbacks
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

export const prepareSearchParameters = (params: IParams) => {
  const parameters = { ...params };
  if (!Object.keys(parameters).every(key => includes(SUPPORTED_PARAMS, key))) {
    throw new Error(
      `Passed unsupported parameter. Supported parameters are ${SUPPORTED_PARAMS.join(', ')}`
    );
  }
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
    const customTags = taggingUtils.generateCustomTags(params.annotations);
    parameters.tags.push(...customTags);
    delete parameters.annotations;
  }

  if (params.exclude_tags) {
    const excludeTags = taggingUtils.generateCustomTags(params.exclude_tags);
    parameters.exclude_tags = excludeTags;
  }

  if (params.exclude_flags) {
    parameters.exclude_tags = [
      ...new Set([...(parameters.exclude_tags || []), ...params.exclude_flags]),
    ];
    delete parameters.exclude_flags;
  }

  return parameters;
};

const convertToExposedRecord = (decryptedRecord: DecryptedRecord) => {
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

export const CURRENT_FHIR_VERSION = '3.0.1';

const fhirService = {
  async createResource(
    ownerId: string,
    fhirResource: fhir.DomainResource,
    date: Date = new Date(),
    annotations: string[] = []
  ): Promise<IRecord> {
    let validationResult;
    try {
      validationResult = await fhirValidator.validate(fhirResource);
    } catch (e) {
      return Promise.reject(
        new ValidationError('Called createResource with an invalid fhirResource parameter.')
      );
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
    date,
    annotations?: string[]
  ): Promise<IRecord> {
    if (!fhirValidator.validate(fhirResource)) {
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

    return recordService
      .updateRecord(ownerId, {
        attachmentKey,
        fhirResource: cleanResource(resource || fhirResource),
        id: fhirResource.id,
        tags: taggingUtils.generateCustomTags(annotations),
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
      .then((previousRecord: DecryptedRecord) => {
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

  fetchResource(ownerId: string, resourceId: string): Promise<IRecord> {
    return recordService.downloadRecord(ownerId, resourceId).then(convertToExposedRecord);
  },

  deleteResource(ownerId: string, resourceId: string): Promise<void> {
    return recordService.deleteRecord(ownerId, resourceId);
  },

  countResources(ownerId: string, params: IParams = {}): Promise<number> {
    const parameters = prepareSearchParameters({
      ...params,
      exclude_flags: [taggingUtils.generateAppDataFlagTag()],
    });
    return recordService.searchRecords(ownerId, parameters, true).then(result => result.totalCount);
  },

  fetchResources(ownerId: string, params: IParams = {}): Promise<IFetchResponse> {
    const parameters = prepareSearchParameters({
      ...params,
      exclude_flags: [taggingUtils.generateAppDataFlagTag()],
    });
    return recordService.searchRecords(ownerId, parameters).then(result => ({
      records: result.records.map(convertToExposedRecord),
      totalCount: result.totalCount,
    }));
  },

  downloadResource(
    ownerId: string,
    resourceId: string,
    options = { imageSize: FULL }
  ): Promise<IRecord> {
    let record;
    let resource;
    let encryptedAttachmentKey;

    return recordService
      .downloadRecord(ownerId, resourceId)
      .then((rec: DecryptedRecord) => {
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
