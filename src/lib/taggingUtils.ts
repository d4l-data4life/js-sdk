import isString from 'lodash/isString';
import stringUtils from './stringUtils';
import fhirService from '../services/fhirService';
import SetupError, { NOT_SETUP } from './errors/SetupError';
import { Tag, TagGroup } from 'services/types';

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

  generateCreationTag(): Tag {
    return this.buildTag(tagKeys.partner, this.getPartnerId());
  },

  generateUpdateTag(): Tag {
    return this.buildTag(tagKeys.updatedByPartner, this.getPartnerId());
  },

  generateAppDataFlagTag(): Tag {
    return this.buildTag(tagKeys.flag, flagKeys.appData);
  },

  /**
   * Generate the Tag for the FHIR version that should be added to the
   * records when creating/updating it
   * @param fhirVersion The FHIR version that should be added as a tag (Default: SDK FHIR version)
   * @returns The Tag containing the FHIR version
   */
  generateFhirVersionTag(fhirVersion = fhirService.getFhirVersion()): Tag {
    return this.buildTag(tagKeys.fhirVersion, fhirVersion);
  },

  /**
   * Generate the TagGroup for the FHIR version which includes all fallback options for searching
   * records
   * @param fhirVersion The FHIR version that should be added as a tag (Default: SDK FHIR version)
   * @returns The TagGroup containing the FHIR Tags
   */
  generateFhirVersionTagForSearch(fhirVersion = fhirService.getFhirVersion()): TagGroup {
    /*
    Earlier versions of the Android SDK did not escape the dots in fhir versions
    */
    const original = this.buildTag(tagKeys.fhirVersion, fhirVersion);
    const fallback = taggingUtils.buildFallbackTag(tagKeys.fhirVersion, fhirVersion);
    return [original, fallback];
  },

  generateTagsFromFhir(fhirObject: Record<string, any>): Tag[] {
    const tagObject: any = {};
    if (fhirObject.resourceType) {
      tagObject[tagKeys.resourceType] = fhirObject.resourceType;
    }
    return Object.keys(tagObject).map(tagKey => this.buildTag(tagKey, tagObject[tagKey]));
  },

  /**
   * Generate the list of Tags that should be added to the record when creating/updating it
   * @param annotationList The list of annotations to build tags for
   * @returns The list of Tags
   */
  generateCustomTags(annotationList: string[] = []): Tag[] {
    return annotationList.map(annotation => this.buildTag(ANNOTATION_LABEL, annotation, false));
  },

  /**
   * Generate the list of Tags and TagGroups which include all required fallback
   * options for searching records
   * @param annotationList The list of annotations to build tags for
   * @returns A list of Tags and TagGroups
   */
  generateCustomTagsForSearch(annotationList: string[] = []): (Tag | TagGroup)[] {
    return annotationList.map(annotation => {
      const tagGroup: TagGroup = [];

      /*
      Original JS SDK implementation was inconsistent in lowercasing/uppercasing
      some escaped characters
      */
      const original: Tag = this.buildTag(ANNOTATION_LABEL, annotation, false);
      const fallbackJS: Tag = this.buildTag(ANNOTATION_LABEL, annotation, true);
      if (original !== fallbackJS) {
        tagGroup.push(fallbackJS);
      }

      /*
      For a brief time the KMP SDK did not encode annotations and tags
      */
      const fallbackKMP: Tag = this.buildFallbackTag(ANNOTATION_LABEL, annotation);
      if (original !== fallbackKMP) {
        tagGroup.push(fallbackKMP);
      }

      return tagGroup.length > 0 ? [original, ...tagGroup] : original;
    });
  },

  buildTag(key: string, value: string, useFallback = false): Tag {
    return (
      `${stringUtils.prepareForUpload(key, useFallback)}` +
      `${TAG_DELIMITER}` +
      `${stringUtils.prepareForUpload(value, useFallback)}`
    );
  },

  buildFallbackTag(key: string, value: string): Tag {
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
