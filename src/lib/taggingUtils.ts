import isString from 'lodash/isString';
import stringUtils from './stringUtils';
import { CURRENT_FHIR_VERSION } from '../services/fhirService';

const TAG_DELIMITER = '=';

const ANNOTATION_LABEL = 'custom';

// all the values will be lowercased by the API
export const tagKeys: { [key: string]: string } = {
  fhirVersion: 'fhirVersion',
  partner: 'partner',
  resourceType: 'resourceType',
  updatedByPartner: 'updatedByPartner',
};

const taggingUtils = {
  partnerId: null,

  setPartnerId(partnerId) {
    this.partnerId = partnerId;
  },

  generateCreationTag() {
    return this.buildTag(tagKeys.partner, this.partnerId);
  },

  generateUpdateTag() {
    return this.buildTag(tagKeys.updatedByPartner, this.partnerId);
  },

  generateFhirVersionTag() {
    return this.buildTag(tagKeys.fhirVersion, CURRENT_FHIR_VERSION);
  },

  generateTagsFromFhir(fhirObject: any) {
    const tagObject: any = {};
    if (fhirObject.resourceType) {
      tagObject[tagKeys.resourceType] = fhirObject.resourceType;
    }
    return Object.keys(tagObject).map(tagKey => this.buildTag(tagKey, tagObject[tagKey]));
  },

  generateCustomTags(annotationList = []) {
    return annotationList.map(el => this.buildTag(ANNOTATION_LABEL, el));
  },

  buildTag(key: string, value: string): string {
    return (
      `${stringUtils.prepareForUpload(key)}` +
      `${TAG_DELIMITER}` +
      `${stringUtils.prepareForUpload(value)}`
    );
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
