/* eslint-disable no-param-reassign, no-await-in-loop */
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

type ClientAttachment = fhir.Attachment & {
  file?: Blob;
  originalSize?: number;
  originalHash?: string;
};

/*
 * This is preliminary work based on the idea that the SDK should be able to handle
 * attachments for all the resources it supports, not just for DocumentReference
 * resources. However, while these methods return the proper attachment structures,
 * there is not support for a generic upload/download mechanism in the fhirService's
 * actual CRUD methods.
 *
 * */
export const getCleanAttachmentsFromResource = (
  resource: fhir.DomainResource
): ClientAttachment[] => {
  const { resourceType } = resource;

  let attachments;
  if (resourceType === 'DocumentReference') {
    attachments = map((resource as fhir.DocumentReference).content, 'attachment');
  }
  if (resourceType === 'Patient') {
    attachments = cloneDeep((resource as fhir.Patient).photo);
  }
  if (resourceType === 'Practitioner') {
    attachments = cloneDeep((resource as fhir.Practitioner).photo);
  }
  if (resourceType === 'Medication') {
    attachments = cloneDeep((resource as fhir.Medication).image);
  }
  if (resourceType === 'DiagnosticReport') {
    attachments = cloneDeep((resource as fhir.DiagnosticReport).presentedForm);
  }
  if (resourceType === 'Observation') {
    const components = [...((resource as fhir.Observation).component || [])];
    attachments = reject(
      [
        ...[(resource as fhir.Observation).valueAttachment || []],
        // @ts-ignore
        ...map(components, 'valueAttachment'),
      ],
      isEmpty
    );
  }
  if (resourceType === 'Questionnaire') {
    const initialAttachments = map((resource as fhir.Questionnaire).item, 'initialAttachment');
    attachments = initialAttachments.length ? reject(initialAttachments, isEmpty) : [];
  }

  if (resourceType === 'QuestionnaireResponse') {
    const answers = flatMap((resource as fhir.QuestionnaireResponse).item, 'answer');
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

export const addPreviewsToAttachments = async vanillaAttachments => {
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

const attachmentService = {
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
};

export default attachmentService;
