import {
  convertArrayBufferViewToString,
  convertBase64ToArrayBufferView,
  symDecryptString,
  symEncryptString,
} from 'js-crypto';
import isError from 'lodash/isError';
import reject from 'lodash/reject';
import { populateCommonKeyId } from '../lib/cryptoUtils';
import dateUtils from '../lib/dateUtils';
import fhirValidator from '../lib/fhirValidator';
import taggingUtils from '../lib/taggingUtils';
import documentRoutes from '../routes/documentRoutes';
import createCryptoService from './createCryptoService';
import { DecryptedAppData, DecryptedFhirRecord, Key, QueryParams } from './types';
import userService from './userService';

const recordService = {
  updateRecord(
    ownerId: string,
    record: DecryptedFhirRecord | DecryptedAppData
  ): Promise<DecryptedFhirRecord | DecryptedAppData> {
    const updateRequest = (userId, params) =>
      documentRoutes.updateRecord(userId, record.id, params);

    return this.downloadRecord(ownerId, record.id).then(downloadedRecord => {
      let tags;
      if (record.tags && !record.tags.length) {
        tags = [taggingUtils.generateUpdateTag()];
      } else {
        tags = record.tags
          ? [...new Set([...record.tags, taggingUtils.generateUpdateTag()])]
          : [...new Set([...downloadedRecord.tags, taggingUtils.generateUpdateTag()])];
      }

      /*
       * AppData case
       * */
      if ((downloadedRecord as DecryptedAppData).data) {
        return this.uploadRecord(
          ownerId,
          {
            ...record,
            tags,
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
            (record as DecryptedFhirRecord).fhirResource
          ),
          tags,
        },
        updateRequest
      );
    });
  },

  createRecord(ownerId: string, record: DecryptedFhirRecord): Promise<DecryptedFhirRecord> {
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
    record: DecryptedFhirRecord,
    uploadRequest: Promise<DecryptedFhirRecord>
  ): Promise<DecryptedFhirRecord> {
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
    record: DecryptedFhirRecord | DecryptedAppData,
    uploadRequest: (userId: string, data: object) => Promise<DecryptedFhirRecord | DecryptedAppData>
  ) {
    const owner = await userService.getUser(ownerId);
    const cryptoService = await createCryptoService(ownerId);
    const bodyDataToEncrypt =
      (record as DecryptedFhirRecord).fhirResource || (record as DecryptedAppData).data;
    const [cipherData, dataKey] = await cryptoService.encryptObject(bodyDataToEncrypt);
    // update keys step makes certain data and attachment keys
    // are encrypted with the latest common key
    // in particular that they are encrypted with the _same_ common key
    // this part is very important as we only store a single common key ID per record
    const keys = (record as DecryptedFhirRecord).attachmentKey
      ? [dataKey, (record as DecryptedFhirRecord).attachmentKey]
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
      fhirResource: (record as DecryptedFhirRecord).fhirResource,
    };
  },

  downloadRecord(ownerId: string, recordId: string): Promise<DecryptedFhirRecord> {
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

  decryptResourceAndTags(record: any, tagKey: Key): Promise<DecryptedFhirRecord> {
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

// @ts-ignore
export default recordService;
