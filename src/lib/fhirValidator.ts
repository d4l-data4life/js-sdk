/* eslint-disable default-case, indent */

import cloneDeep from 'lodash/cloneDeep';
import isObjectLike from 'lodash/isObjectLike';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import omit from 'lodash/omit';

import ValidationError from './errors/ValidationError';
import { FHIR_VERSION_STU3, FHIR_VERSION_R4, SUPPORTED_RESOURCES } from './models/fhir/helper';
import fhirService from '../services/fhirService';

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
            returnPromise = import('@d4l/js-fhir-validator/r4/js/Encounter').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;
          case 'DocumentReference':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/DocumentReference').then(
              bundle => {
                this.validator[version][resourceType] = bundle;
                return this.validator[version][resourceType];
              }
            );
            break;

          case 'Practitioner':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/Practitioner').then(bundle => {
              this.validator[resourceType] = bundle;
              return this.validator[resourceType];
            });
            break;

          case 'Patient':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/Patient').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'Questionnaire':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/Questionnaire').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'QuestionnaireResponse':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/QuestionnaireResponse').then(
              bundle => {
                this.validator[version][resourceType] = bundle;
                return this.validator[version][resourceType];
              }
            );
            break;

          case 'DiagnosticReport':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/DiagnosticReport').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'ResearchSubject':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/ResearchSubject').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;
          case 'Observation':
            returnPromise = import('@d4l/js-fhir-validator/r4/js/Observation').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;
        }
      } else if (version === FHIR_VERSION_STU3) {
        switch (resourceType) {
          case 'DocumentReference':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/DocumentReference').then(
              bundle => {
                this.validator[version][resourceType] = bundle;
                return this.validator[version][resourceType];
              }
            );
            break;

          case 'Patient':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/Patient').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'Practitioner':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/Practitioner').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'Observation':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/Observation').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'DiagnosticReport':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/DiagnosticReport').then(
              bundle => {
                this.validator[version][resourceType] = bundle;
                return this.validator[version][resourceType];
              }
            );
            break;

          case 'Questionnaire':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/Questionnaire').then(bundle => {
              this.validator[version][resourceType] = bundle;
              return this.validator[version][resourceType];
            });
            break;

          case 'QuestionnaireResponse':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/QuestionnaireResponse').then(
              bundle => {
                this.validator[version][resourceType] = bundle;
                return this.validator[version][resourceType];
              }
            );
            break;

          case 'ResearchSubject':
            returnPromise = import('@d4l/js-fhir-validator/stu3/js/ResearchSubject').then(
              bundle => {
                this.validator[version][resourceType] = bundle;
                return this.validator[version][resourceType];
              }
            );
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
      let errorMessage = `Validating "${resourceType}" failed. `;
      if (validator.errors?.length) {
        errorMessage += `The following error(s) were encountered: `;
        errorMessage += validator.errors
          .map(errorObject => {
            let messageBlock = `For ${errorObject.keyword}: ${errorObject.message}. There might be additional information below. \n`;
            if (errorObject.dataPath?.length) {
              messageBlock += `dataPath: ${errorObject.dataPath} `;
            }
            if (errorObject.schemaPath?.length) {
              messageBlock += `schemaPath: ${errorObject.schemaPath}`;
            }

            return messageBlock;
          })
          .join(`\n`);
      }
      throw new ValidationError(errorMessage);
    }

    return true;
  },
};

export default fhirValidator;
