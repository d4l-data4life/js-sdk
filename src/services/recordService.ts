import {
  convertArrayBufferViewToString,
  convertBase64ToArrayBufferView,
  symDecryptString,
  symEncryptString,
  // @ts-ignore
} from 'js-crypto';

import isError from 'lodash/isError';
import reject from 'lodash/reject';

import dateUtils from '../lib/dateUtils';
import fhirValidator from '../lib/fhirValidator';
import taggingUtils from '../lib/taggingUtils';
import documentRoutes from '../routes/documentRoutes';
import createCryptoService from './createCryptoService';
import userService from './userService';
import { populateCommonKeyId } from '../lib/cryptoUtils';

export interface EncryptedDataKey {
  commonKeyId: string;
  encryptedKey: string;
}

export interface Key {
  t: string;
  v: number;
  sym: string;
}

export interface IDecryptedRecord {
  id?: string;
  fhirResource: fhir.DomainResource;
  tags?: string[];
  attachmentKey?: EncryptedDataKey;
  customCreationDate?: Date;
  updatedDate?: Date;
  commonKeyId?: string;
}

export interface IQueryParams {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
}

const recordService = {
  updateRecord(ownerId: string, record: IDecryptedRecord): Promise<IDecryptedRecord> {
    const updateRequest = (userId, params) =>
      documentRoutes.updateRecord(userId, record.id, params);

    return this.downloadRecord(ownerId, record.id).then(downloadedRecord =>
      this.uploadFhirRecord(
        ownerId,
        {
          ...record,
          fhirResource: Object.assign(downloadedRecord.fhirResource, record.fhirResource),
          // include new tags passed in record,
          // previous tags, and tags specific to update method
          tags: [
            ...(record.tags || []),
            taggingUtils.generateUpdateTag(),
            ...downloadedRecord.tags,
          ],
        },
        updateRequest
      )
    );
  },

  createRecord(ownerId: string, record: IDecryptedRecord): Promise<IDecryptedRecord> {
    return this.uploadFhirRecord(
      ownerId,
      {
        ...record,
        // add tags generated during creation, and tags passed during upload
        tags: [...(record.tags || []), taggingUtils.generateCreationTag()],
      },
      documentRoutes.createRecord
    );
  },

  uploadFhirRecord(
    ownerId: string,
    record: IDecryptedRecord,
    uploadRequest: Promise<IDecryptedRecord>
  ): Promise<IDecryptedRecord> {
    return fhirValidator.validate(record.fhirResource).then(() =>
      this.uploadRecord(
        ownerId,
        {
          ...record,
          tags: [
            ...new Set([...record.tags, ...taggingUtils.generateTagsFromFhir(record.fhirResource)]),
          ],
        },
        uploadRequest
      )
    );
  },

  async uploadRecord(
    ownerId: string,
    record: IDecryptedRecord,
    uploadRequest: (userId: string, data: object) => Promise<any>
  ) {
    const owner = await userService.getUser(ownerId);
    const cryptoService = await createCryptoService(ownerId);
    const [cipherData, dataKey] = await cryptoService.encryptObject(record.fhirResource);
    // update keys step makes certain data and attachment keys
    // are encrypted with the latest common key
    // in particular that they are encrypted with the _same_ common key
    // this part is very important as we only store a single common key ID per record
    const keys = record.attachmentKey ? [dataKey, record.attachmentKey] : [dataKey];
    const [syncedDataKey, syncedAttachmentKey] = await cryptoService.updateKeys(...keys);
    const encryptedTags = await Promise.all(
      record.tags.map(tag => symEncryptString(owner.tek, tag))
    );
    const result = await uploadRequest(owner.id, {
      attachment_key: syncedAttachmentKey?.encryptedKey,
      date: dateUtils.formatDateYyyyMmDd(record.customCreationDate || new Date()),
      encrypted_body: cipherData,
      encrypted_key: syncedDataKey.encryptedKey,
      encrypted_tags: encryptedTags,
      // @ts-ignore
      model_version: __DATA_MODEL_VERSION__,
      common_key_id: syncedDataKey.commonKeyId,
    });

    return {
      customCreationDate: result.date,
      fhirResource: record.fhirResource,
      id: result.record_id,
      tags: record.tags,
      updatedDate: result.createdAt,
    };
  },

  downloadRecord(ownerId: string, recordId: string): Promise<IDecryptedRecord> {
    return documentRoutes
      .downloadRecord(ownerId, recordId)
      .then(result =>
        userService.getUser(ownerId).then(user => this.decryptResourceAndTags(result, user.tek))
      );
  },

  searchRecords(ownerId: string, params: IQueryParams, countOnly = false): Promise<any> {
    let user;
    let totalCount;

    return (
      userService
        .getUser(ownerId)
        // @ts-ignore
        .then(userObject => {
          user = userObject;

          if (params?.tags?.length) {
            return Promise.all(params.tags.map(tag => symEncryptString(user.tek, tag))).then(
              tags => ({
                ...params,
                tags,
              })
            );
          }
          return params;
        })
        .then(queryParams =>
          countOnly
            ? documentRoutes.getRecordsCount(user.id, queryParams)
            : documentRoutes.searchRecords(user.id, queryParams)
        )
        .then(searchResult => {
          totalCount = searchResult.totalCount;
          /* eslint-disable indent */
          return searchResult.records
            ? Promise.all(
                searchResult.records.map(result =>
                  this.decryptResourceAndTags(result, user.tek).catch(err => {
                    // eslint-disable-next-line no-console
                    console.warn(`Decryption failed for record: ${result.record_id}`, err);
                    return new Error(err);
                  })
                )
              )
            : undefined;
          /* eslint-enable indent */
        })
        .then(results =>
          results ? { totalCount, records: reject(results, isError) } : { totalCount }
        )
    );
  },

  deleteRecord(ownerId: string, recordId: string) {
    return documentRoutes.deleteRecord(ownerId, recordId);
  },

  decryptResourceAndTags(record: any, tagKey: Key): Promise<IDecryptedRecord> {
    const tagsPromise = Promise.all<string>(
      record.encrypted_tags.map(tag => symDecryptString(tagKey, tag))
    );

    const recordPromise = createCryptoService(record.user_id)
      .decryptData(
        {
          commonKeyId: populateCommonKeyId(record.common_key_id),
          encryptedKey: record.encrypted_key,
        },
        convertBase64ToArrayBufferView(record.encrypted_body)
      )
      .then(convertArrayBufferViewToString)
      // @ts-ignore
      .then(JSON.parse);
    return Promise.all([recordPromise, tagsPromise]).then(([decryptedResource, decryptedTags]) => {
      const fhirResource = decryptedResource;
      fhirResource.id = record.record_id;
      const commonKeyId = populateCommonKeyId(record.common_key_id);
      let attachmentKey = record.attachment_key;
      if (attachmentKey) {
        attachmentKey = {
          commonKeyId,
          encryptedKey: attachmentKey,
        };
      }
      return {
        fhirResource,
        attachmentKey,
        commonKeyId,
        customCreationDate: new Date(record.date),
        id: record.record_id,
        tags: decryptedTags,
        updatedDate: new Date(record.createdAt),
      };
    });
  },
};

export default recordService;
