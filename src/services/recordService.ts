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
import { DecryptedAppData } from './appDataService';

export interface EncryptedDataKey {
  commonKeyId: string;
  encryptedKey: string;
}

export interface Key {
  t: string;
  v: number;
  sym: string;
}

// todo: rename this to DecryptedFhirRecord?
export interface DecryptedRecord {
  id?: string;
  fhirResource?: fhir.DomainResource;
  tags?: string[];
  attachmentKey?: EncryptedDataKey;
  customCreationDate?: Date;
  updatedDate?: Date;
  commonKeyId?: string;
}

export interface QueryParams {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  exclude_tags?: string[];
}

const recordService = {
  updateRecord(
    ownerId: string,
    record: DecryptedRecord | DecryptedAppData
  ): Promise<DecryptedRecord | DecryptedAppData> {
    const updateRequest = (userId, params) =>
      documentRoutes.updateRecord(userId, record.id, params);

    return this.downloadRecord(ownerId, record.id).then(downloadedRecord => {
      /*
       * AppData case
       * */
      if ((downloadedRecord as DecryptedAppData).data) {
        return this.uploadRecord(
          ownerId,
          {
            ...record,
            tags: [
              ...new Set([
                ...record.tags,
                taggingUtils.generateUpdateTag(),
                ...downloadedRecord.tags,
              ]),
            ],
          },
          updateRequest
        );
      }

      /*
       * FHIR case
       * */
      return this.uploadFhirRecord(
        ownerId,
        {
          ...record,
          fhirResource: Object.assign(
            downloadedRecord.fhirResource,
            (record as DecryptedRecord).fhirResource
          ),
          // include new tags passed in record,
          // previous tags, and tags specific to update method
          tags: [
            ...(record.tags || []),
            taggingUtils.generateUpdateTag(),
            ...downloadedRecord.tags,
          ],
        },
        updateRequest
      );
    });
  },

  createRecord(ownerId: string, record: DecryptedRecord): Promise<DecryptedRecord> {
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
    record: DecryptedRecord,
    uploadRequest: Promise<DecryptedRecord>
  ): Promise<DecryptedRecord> {
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
    record: DecryptedRecord | DecryptedAppData,
    uploadRequest: (userId: string, data: object) => Promise<DecryptedRecord | DecryptedAppData>
  ) {
    const owner = await userService.getUser(ownerId);
    const cryptoService = await createCryptoService(ownerId);
    const bodyDataToEncrypt =
      (record as DecryptedRecord).fhirResource || (record as DecryptedAppData).data;
    const [cipherData, dataKey] = await cryptoService.encryptObject(bodyDataToEncrypt);
    // update keys step makes certain data and attachment keys
    // are encrypted with the latest common key
    // in particular that they are encrypted with the _same_ common key
    // this part is very important as we only store a single common key ID per record
    const keys = (record as DecryptedRecord).attachmentKey
      ? [dataKey, (record as DecryptedRecord).attachmentKey]
      : [dataKey];
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

    const returnObject = {
      // @ts-ignore
      customCreationDate: result.date,
      // @ts-ignore
      id: result.record_id,
      tags: record.tags,
      // @ts-ignore
      updatedDate: result.createdAt,
    };

    if ((record as DecryptedAppData).data) {
      return {
        ...returnObject,
        data: (record as DecryptedAppData).data,
      };
    }

    return {
      ...returnObject,
      fhirResource: (record as DecryptedRecord).fhirResource,
    };
  },

  downloadRecord(ownerId: string, recordId: string): Promise<DecryptedRecord> {
    return documentRoutes
      .downloadRecord(ownerId, recordId)
      .then(result =>
        userService.getUser(ownerId).then(user => this.decryptResourceAndTags(result, user.tek))
      );
  },

  searchRecords(ownerId: string, params: QueryParams, countOnly = false): Promise<any> {
    let user;
    let totalCount;

    return (
      userService
        .getUser(ownerId)
        // @ts-ignore
        .then(userObject => {
          user = userObject;
          const encryptedTagsPromise = params?.tags?.length
            ? Promise.all(params.tags.map(tag => symEncryptString(user.tek, tag)))
            : Promise.resolve([]);
          const excludeTagsPromise = params?.exclude_tags?.length
            ? Promise.all(params.exclude_tags.map(tag => symEncryptString(user.tek, tag)))
            : Promise.resolve([]);
          return Promise.all([encryptedTagsPromise, excludeTagsPromise]).then(
            ([tags, excludeTags]) => ({
              ...params,
              tags,
              exclude_tags: excludeTags,
            })
          );
        })
        .then(queryParams =>
          countOnly
            ? documentRoutes.getRecordsCount(user.id, queryParams)
            : documentRoutes.searchRecords(user.id, queryParams)
        )
        .then((searchResult: { records?: any[]; totalCount: number }) => {
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

  decryptResourceAndTags(record: any, tagKey: Key): Promise<DecryptedRecord> {
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
    return Promise.all([recordPromise, tagsPromise]).then(([decryptedRecord, decryptedTags]) => {
      const commonKeyId = populateCommonKeyId(record.common_key_id);
      let attachmentKey = record.attachment_key;
      if (attachmentKey) {
        attachmentKey = {
          commonKeyId,
          encryptedKey: attachmentKey,
        };
      }

      const returnObject = {
        attachmentKey,
        commonKeyId,
        customCreationDate: new Date(record.date),
        id: record.record_id,
        tags: decryptedTags,
        updatedDate: new Date(record.createdAt),
      };

      if (decryptedTags?.some(tag => tag === taggingUtils.generateAppDataFlagTag())) {
        return {
          ...returnObject,
          data: decryptedRecord,
        };
      }
      const fhirResource = decryptedRecord;
      fhirResource.id = record.record_id;
      return {
        ...returnObject,
        fhirResource,
      };
    });
  },
};

export default recordService;
