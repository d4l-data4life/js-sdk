import isString from 'lodash/isString';
import stringUtils from './stringUtils';
import fhirService from '../services/fhirService';
import SetupError, { NOT_SETUP } from './errors/SetupError';

const TAG_DELIMITER = '=';

const ANNOTATION_LABEL = 'custom';

// all the values will be lowercased by the API
export const tagKeys: { [key: string]: string } = {
  fhirVersion: 'fhirVersion',
  flag: 'flag',
  partner: 'partner',
  resourceType: 'resourceType',
  updatedByPartner: 'updatedByPartner',
};

// all the values will be lowercased by the API
export const flagKeys: { [key: string]: string } = {
  appData: 'appData',
};

const taggingUtils = {
  partnerId: null,

  reset() {
    this.partnerId = null;
  },

  setPartnerId(partnerId: string | null): void {
    this.partnerId = partnerId;
  },

  getPartnerId(): string {
    if (!this.partnerId) {
      throw new SetupError(NOT_SETUP);
    }
    return this.partnerId;
  },

  generateCreationTag(): string {
    return this.buildTag(tagKeys.partner, this.getPartnerId());
  },

  generateUpdateTag(): string {
    return this.buildTag(tagKeys.updatedByPartner, this.getPartnerId());
  },

  generateAppDataFlagTag(): string {
    return this.buildTag(tagKeys.flag, flagKeys.appData);
  },

  generateFhirVersionTag(): string {
    return this.buildTag(tagKeys.fhirVersion, fhirService.getFhirVersion());
  },

  generateTagsFromFhir(fhirObject: Record<string, any>): string[] {
    const tagObject: any = {};
    if (fhirObject.resourceType) {
      tagObject[tagKeys.resourceType] = fhirObject.resourceType;
    }
    return Object.keys(tagObject).map(tagKey => this.buildTag(tagKey, tagObject[tagKey]));
  },

  generateCustomTags({
    annotations = [],
    useFallback = false,
  }: {
    annotations: string[];
    useFallback?: boolean;
  }): string[] {
    return annotations.map(el => this.buildTag(ANNOTATION_LABEL, el, useFallback));
  },

  buildTag(key: string, value: string, useFallback = false): string {
    return (
      `${stringUtils.prepareForUpload(key, useFallback)}` +
      `${TAG_DELIMITER}` +
      `${stringUtils.prepareForUpload(value, useFallback)}`
    );
  },

  buildFallbackTag(key: string, value: string): string {
    return `${key.toLowerCase()}${TAG_DELIMITER}${value.toLowerCase()}`;
  },

  getTagValueFromList(tagList: string[], tagKey: string): string {
    const clientTag = tagList.find(el => el.startsWith(`${tagKey}${TAG_DELIMITER}`));
    return clientTag ? this.getValue(clientTag) : undefined;
  },

  getValue(tag: string): string {
    const value = tag.split(TAG_DELIMITER)[1]; // eslint-disable-line prefer-destructuring
    return isString(value) ? stringUtils.removePercentEncoding(value) : undefined;
  },

  getAnnotations(tagList) {
    return tagList.reduce((annotations, el) => {
      if (el.includes(`${ANNOTATION_LABEL}${TAG_DELIMITER}`)) {
        annotations.push(this.getValue(el));
      }
      return annotations;
    }, []);
  },
};

export default taggingUtils;
