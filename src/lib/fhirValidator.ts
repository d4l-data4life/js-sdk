import cloneDeep from 'lodash/cloneDeep';
import isObjectLike from 'lodash/isObjectLike';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import omit from 'lodash/omit';

import ValidationError from './errors/ValidationError';
import { SUPPORTED_RESOURCES } from './models/fhir/helper';
import fhirService from '../services/fhirService';

const fhirValidator = {
  getRefName(definitionName: string): string {
    return `${'fhir.schema.json'}#/definitions/${definitionName}`;
  },

  isValidResourceType(resourceType: string): boolean {
    return SUPPORTED_RESOURCES[fhirService.getFhirVersion()].includes(resourceType);
  },

  getValidator(resourceType: string): Promise<boolean> {
    if (this.validator && this.validator[resourceType]) {
      return Promise.resolve(this.validator[resourceType]);
    }

    this.validator = this.validator || {};

    let returnPromise = Promise.resolve(false);

    // todo: this needs to be distinguished by the currenty used fhirVersion
    if (resourceType === 'Encounter') {
      returnPromise = import('../../fhir/r4/encounter').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'DocumentReference') {
      returnPromise = import('../../fhir/stu3/documentreference').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'Patient') {
      returnPromise = import('../../fhir/stu3/patient').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'Practitioner') {
      returnPromise = import('../../fhir/stu3/practitioner').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'Observation') {
      returnPromise = import('../../fhir/stu3/observation').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'DiagnosticReport') {
      returnPromise = import('../../fhir/stu3/diagnosticreport').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'Questionnaire') {
      returnPromise = import('../../fhir/stu3/questionnaire').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'QuestionnaireResponse') {
      returnPromise = import('../../fhir/stu3/questionnaireresponse').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    if (resourceType === 'ResearchSubject') {
      returnPromise = import('../../fhir/stu3/researchsubject').then(bundle => {
        this.validator[resourceType] = bundle.default;
        return this.validator[resourceType];
      });
    }

    /*
     * This is, for now, a deliberately simplified version that just deals with our own
     * "Organization" as attached to Documents by the native apps.
     * If we ever support Organization resources properly,
     * we need to build and import a real bundle.
     *
     * */
    if (resourceType === 'Organization') {
      this.validator[resourceType] = resource => resource.id && resource.id.length;
      returnPromise = Promise.resolve(this.validator[resourceType]);
    }

    return returnPromise;
  },

  async validate(resource: fhir.DomainResource): Promise<Error | true> {
    if (isUndefined(resource)) {
      throw new ValidationError('No resource provided.');
    }

    if (isArray(resource) || !isObjectLike(resource)) {
      throw new ValidationError('Resource needs to be an object.');
    }

    const { resourceType } = resource;

    if (isUndefined(resourceType)) {
      throw new ValidationError(
        `Resource object does not have a resource type. ${
          // @ts-ignore
          !isUndefined(resource.fhirResource)
            ? 'Did you mean to submit the .fhirResource property?'
            : ''
        }`
      );
    }

    if (!this.isValidResourceType(resourceType)) {
      throw new ValidationError(
        `"${resourceType}" is not a valid resource type. Supported types for FHIR Version ${fhirService.getFhirVersion()} are ${
          SUPPORTED_RESOURCES[fhirService.getFhirVersion()]
        }.join(
          ', '
        )}.}`
      );
    }

    const validator = await this.getValidator(resourceType);
    const containedResources = cloneDeep(resource.contained);
    let resourceToValidate = resource;
    if (containedResources && containedResources.length) {
      resourceToValidate = omit(resource, ['contained']);
      await Promise.all(
        containedResources.map(containedResource => this.validate(containedResource))
      );
    }

    const validationResult = validator(resourceToValidate);

    if (!validationResult) {
      throw new ValidationError(`Validating "${resourceType}" failed.`);
    }

    return true;
  },
};

export default fhirValidator;
