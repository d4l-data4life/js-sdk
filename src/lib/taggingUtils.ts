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

  /**
   * Generate the tag for the FHIR version
   *
   * Note: When generating the tag for a search, the tag will
   *       will include the fallback option
   * @param fhirVersion The FHIR version that should be added as a tag (Default: SDK FHIR version)
   * @param isSearch Flag indicating if the tags are used for search or not
   * @returns The string containing the FHIR version tag
   */
  generateFhirVersionTag(fhirVersion = fhirService.getFhirVersion(), isSearch = false): string {
    const original = this.buildTag(tagKeys.fhirVersion, fhirVersion);
    if (!isSearch) {
      return original;
    }
    /*
    Earlier versions of the Android SDK did not escape the dots in fhir versions,
    so we query for both of this encoding and the current standard one by combining
    both version into an OR query
    */
    const fallback = taggingUtils.buildFallbackTag(tagKeys.fhirVersion, fhirVersion);
    return `(${original},${fallback})`;
  },

  generateTagsFromFhir(fhirObject: Record<string, any>): string[] {
    const tagObject: any = {};
    if (fhirObject.resourceType) {
      tagObject[tagKeys.resourceType] = fhirObject.resourceType;
    }
    return Object.keys(tagObject).map(tagKey => this.buildTag(tagKey, tagObject[tagKey]));
  },

  /**
   * Generate the list of tags out of a list of annotations
   *
   * Note: When generating the tags for a search, the tags will
   *       include the fallback option, if it is required
   * @param annotationList The list of annotations to build tags for
   * @param isSearch Flag indicating if the tags are used for a search or not
   * @returns A list of tags
   */
  generateCustomTags(annotationList: string[] = [], isSearch = false) {
    return annotationList.map(annotation => {
      const original = this.buildTag(ANNOTATION_LABEL, annotation, false);
      if (!isSearch) {
        return original;
      }
      /*
      Original JS SDK implementation was inconsistent in lowercasing/uppercasing
      some escaped characters, so we query for both versions by combining
      both version into an OR query
      */
      const fallback = this.buildTag(ANNOTATION_LABEL, annotation, true);
      if (original !== fallback) {
        return `(${original},${fallback})`;
      }
      return original;
    });
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
