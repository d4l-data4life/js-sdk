/* eslint-disable no-useless-computed-key */

import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import omitBy from 'lodash/omitBy';
// todo: figure out why these imports weren't working
// import { FHIR_VERSION_R4, FHIR_VERSION_STU3 } from '../../../services/fhirService';

export const createCodeableConcept = (
  display?: string,
  code?: string,
  system?: string
): fhir.CodeableConcept => ({
  coding: [omitBy({ display, code, system }, value => !value || isEmpty(value))],
});

export const getCodeFromCodeableConcept = (fhirCodeableConcept: fhir.CodeableConcept): string =>
  fhirCodeableConcept?.coding?.[0].code;

export const getDisplayFromCodeableConcept = (fhirCodeableConcept: fhir.CodeableConcept): string =>
  fhirCodeableConcept?.coding?.[0].display;

export interface FHIRResource {
  id: string;
  resourceType: string;
}

export const getResource = (ref: fhir.Reference, resources: FHIRResource[]): FHIRResource =>
  find(resources, { id: ref.reference.substring(1) });

export const SUPPORTED_RESOURCES = {
  // todo: use imported constants
  ['4.0.1']: [
    'Encounter',
    'DocumentReference',
    'DiagnosticReport',
    'Patient',
    'Practitioner',
    'Observation',
    'Organization',
    'Questionnaire',
    'QuestionnaireResponse',
    'ResearchSubject',
  ],
  ['3.0.1']: [
    'DocumentReference',
    'DiagnosticReport',
    'Patient',
    'Practitioner',
    'Observation',
    'Organization',
    'Questionnaire',
    'QuestionnaireResponse',
    'ResearchSubject',
  ],
};
