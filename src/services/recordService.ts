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
import {
  DecryptedAppData,
  DecryptedFhirRecord,
  Key,
  QueryParams,
  SearchParameters,
  Tag,
  TagGroup,
} from './types';
import userService, { SymKey } from './userService';

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

  /**
   * Encrypt a tag or a tag group with the user's tag encryption key
   *
   * A tag group starts with an opening bracket "(" and ends with a closing bracket ")" and
   * includes a comma separated list of tags
   * @param tek The tag encryption key of the user
   * @param tag The tag or tag group to encrypt
   * @returns The encrypted tag or tag group
   */
  async encryptTag(tek: SymKey, tag: Tag | TagGroup) {
    if (Array.isArray(tag)) {
      return `(${(await Promise.all(tag.map(partial => symEncryptString(tek, partial)))).join(
        ','
      )})`;
    }
    return symEncryptString(tek, tag);
  },

  async searchRecords(ownerId: string, params: SearchParameters, countOnly = false): Promise<any> {
    const user = await userService.getUser(ownerId);

    let encryptedTags: string[] = [];
    if (params?.tags?.length) {
      encryptedTags = await Promise.all(
        params.tags.map(async tag => recordService.encryptTag(user.tek, tag))
      );
    }

    let encryptedExcludedTags: string[] = [];
    if (params?.exclude_tags?.length) {
      encryptedExcludedTags = await Promise.all(
        params.exclude_tags.map(async tag => recordService.encryptTag(user.tek, tag))
      );
    }

    const queryParams = {
      ...params,
      tags: encryptedTags,
      exclude_tags: encryptedExcludedTags,
    };

    const searchResults: { records?: any[]; totalCount: number } = countOnly
      ? await documentRoutes.getRecordsCount(user.id, queryParams)
      : await documentRoutes.searchRecords(user.id, queryParams);

    if (searchResults.records) {
      const encryptedRecords = await Promise.all(
        searchResults.records.map(searchResult =>
          this.decryptResourceAndTags(searchResult, user.tek).catch(err => {
            // eslint-disable-next-line no-console
            console.warn(`Decryption failed for record: ${searchResult.record_id}`, err);
            return new Error(err);
          })
        )
      );
      return { totalCount: searchResults.totalCount, records: reject(encryptedRecords, isError) };
    }
    return { totalCount: searchResults.totalCount };
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
