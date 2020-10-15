/* eslint-disable default-case, indent */

import cloneDeep from 'lodash/cloneDeep';
import isObjectLike from 'lodash/isObjectLike';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import omit from 'lodash/omit';

import ValidationError from './errors/ValidationError';
import { SUPPORTED_RESOURCES } from './models/fhir/helper';
import fhirService, { FHIR_VERSION_R4, FHIR_VERSION_STU3 } from '../services/fhirService';

const fhirValidator = {
  getRefName(definitionName: string): string {
    return `${'fhir.schema.json'}#/definitions/${definitionName}`;
  },

  isValidResourceType(resourceType: string): boolean {
    return SUPPORTED_RESOURCES[fhirService.getFhirVersion()].includes(resourceType);
  },

  // eslint-disable-next-line complexity
  getValidator(resourceType: string): Promise<boolean> {
    const version = fhirService.getFhirVersion();
    if (this.validator && this.validator[version] && this.validator[version][resourceType]) {
      return Promise.resolve(this.validator[version][resourceType]);
    }

    this.validator = this.validator || {};
    this.validator[version] = this.validator[version] || {};

    let returnPromise = Promise.resolve(false);

    /*
     * This is, for now, a deliberately simplified version that just deals with our own
     * "Organization" as attached to Documents by the native apps.
     * If we ever support Organization resources properly,
     * we need to build and import a real bundle.
     *
     * */
    if (resourceType === 'Organization') {
      this.validator[version][resourceType] = resource => resource.id && resource.id.length;
      returnPromise = Promise.resolve(this.validator[version][resourceType]);
    } else {
      // eslint-disable-next-line no-lonely-if
      if (version === FHIR_VERSION_R4) {
        switch (resourceType) {
          case 'Encounter':
            returnPromise = import('../../fhir/r4/encounter').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;
          case 'DocumentReference':
            returnPromise = import('../../fhir/r4/documentreference').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'Practitioner':
            returnPromise = import('../../fhir/r4/practitioner').then(bundle => {
              this.validator[resourceType] = bundle.default;
              return this.validator[resourceType];
            });
            break;

          case 'Patient':
            returnPromise = import('../../fhir/r4/patient').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'Questionnaire':
            returnPromise = import('../../fhir/r4/questionnaire').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'QuestionnaireResponse':
            returnPromise = import('../../fhir/r4/questionnaireresponse').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'DiagnosticReport':
            returnPromise = import('../../fhir/r4/diagnosticreport').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'ResearchSubject':
            returnPromise = import('../../fhir/r4/researchsubject').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;
          case 'Observation':
            returnPromise = import('../../fhir/r4/observation').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;
        }
      } else if (version === FHIR_VERSION_STU3) {
        switch (resourceType) {
          case 'DocumentReference':
            returnPromise = import('../../fhir/stu3/documentreference').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'Patient':
            returnPromise = import('../../fhir/stu3/patient').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'Practitioner':
            returnPromise = import('../../fhir/stu3/practitioner').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'Observation':
            returnPromise = import('../../fhir/stu3/observation').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'DiagnosticReport':
            returnPromise = import('../../fhir/stu3/diagnosticreport').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'Questionnaire':
            returnPromise = import('../../fhir/stu3/questionnaire').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'QuestionnaireResponse':
            returnPromise = import('../../fhir/stu3/questionnaireresponse').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;

          case 'ResearchSubject':
            returnPromise = import('../../fhir/stu3/researchsubject').then(bundle => {
              this.validator[version][resourceType] = bundle.default;
              return this.validator[version][resourceType];
            });
            break;
        }
      }
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
        `"${resourceType}" is not a valid resource type. Supported types for FHIR Version ${fhirService.getFhirVersion()} are ${SUPPORTED_RESOURCES[
          fhirService.getFhirVersion()
        ].join(', ')}.`
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
