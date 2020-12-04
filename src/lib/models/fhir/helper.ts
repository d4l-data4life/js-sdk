import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import omitBy from 'lodash/omitBy';

export const FHIR_VERSION_STU3 = '3.0.1';
export const FHIR_VERSION_R4 = '4.0.1';

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
  [FHIR_VERSION_R4]: [
    'Encounter',
    'DocumentReference',
    'DiagnosticReport',
    'Patient',
    'Practitioner',
    'PractitionerRole',
    'Observation',
    'Organization',
    'Questionnaire',
    'QuestionnaireResponse',
    'ResearchSubject',
  ],
  [FHIR_VERSION_STU3]: [
    'DocumentReference',
    'DiagnosticReport',
    'Patient',
    'Practitioner',
    'PractitionerRole',
    'Observation',
    'Organization',
    'Questionnaire',
    'QuestionnaireResponse',
    'ResearchSubject',
  ],
};
