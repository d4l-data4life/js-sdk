import taggingUtils, { tagKeys, flagKeys } from '../lib/taggingUtils';
import documentRoutes from '../routes/documentRoutes';
import recordService from './recordService';
import { prepareSearchParameters } from './fhirService';

export interface DecryptedAppData {
  id?: string;
  data: any;
  tags?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  commonKeyId?: string;
}

interface IRecord {
  id?: string;
  fhirResource: fhir.DomainResource;
  annotations?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  partner?: string;
}
interface IFetchResponse {
  totalCount: number;
  records: IRecord[];
}

const convertToExposedAppData = (decryptedAppData: DecryptedAppData) => ({
  annotations: taggingUtils.getAnnotations(decryptedAppData.tags),
  customCreationDate: decryptedAppData.customCreationDate,
  data: decryptedAppData.data,
  id: decryptedAppData.id,
  partner: taggingUtils.getTagValueFromList(decryptedAppData.tags, tagKeys.partner),
  updatedDate: decryptedAppData.updatedDate,
});

const appDataService = {
  createAppData(
    ownerId: string,
    data: any,
    date: Date = new Date(),
    annotations: string[] = []
  ): Promise<any> {
    return (
      recordService
        .uploadRecord(
          ownerId,
          {
            data,
            customCreationDate: date,
            tags: [
              ...new Set([
                ...taggingUtils.generateCustomTags(annotations),
                taggingUtils.generateAppDataFlagTag(),
              ]),
            ],
          },
          documentRoutes.createRecord
        )
        // @ts-ignore
        .then(convertToExposedAppData)
        .catch(error => {
          // eslint-disable-next-line no-console
          console.warn(error);
          return Promise.reject(new Error('Creating the AppData Entity failed'));
        })
    );
  },

  updateAppData(
    ownerId: string,
    data: any,
    id: string,
    date,
    annotations?: string[]
  ): Promise<any> {
    let tags;
    /* eslint-disable indent */
    if (annotations) {
      tags = annotations.length
        ? [
            ...new Set([
              ...taggingUtils.generateCustomTags(annotations),
              taggingUtils.generateAppDataFlagTag(),
            ]),
          ]
        : [];
      /* eslint-enable indent */
    }
    return recordService
      .updateRecord(ownerId, {
        data,
        id,
        tags,
        customCreationDate: date,
      })
      .then(convertToExposedAppData);
  },

  fetchAppData(ownerId: string, appDataId: string): Promise<DecryptedAppData> {
    return recordService.downloadRecord(ownerId, appDataId).then(convertToExposedAppData);
  },

  deleteAppData(ownerId: string, resourceId: string): Promise<void> {
    return recordService.deleteRecord(ownerId, resourceId);
  },

  fetchAllAppData(ownerId: string): Promise<IFetchResponse> {
    const parameters = prepareSearchParameters({
      tags: [taggingUtils.generateAppDataFlagTag()],
    });

    return recordService.searchRecords(ownerId, parameters).then(result => ({
      records: result.records.map(convertToExposedAppData),
      totalCount: result.totalCount,
    }));
  },
};

export default appDataService;
