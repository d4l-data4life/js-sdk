/* eslint-env mocha */
/* eslint-disable lodash/prefer-lodash-typecheck,max-nested-callbacks,max-len */
/* eslint-disable no-unused-expressions */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import fhirValidator from '../../src/lib/fhirValidator';

import stu3DiagnosticReportExamples from './resources/stu3/diagnosticreport-examples';
import stu3DocumentReferenceExamples from './resources/stu3/documentreference-examples';
import stu3OrganizationExamples from './resources/stu3/organization-examples';
import stu3PatientExamples from './resources/stu3/patient-examples';
import stu3PractitionerExamples from './resources/stu3/practitioner-examples';
import stu3QuestionnaireExamples from './resources/stu3/questionnaire-examples';
import stu3QuestionnaireResponseExamples from './resources/stu3/questionnaireresponse-examples';
import stu3ObservationExamples from './resources/stu3/observation-examples';
import stu3ResearchSubjectExamples from './resources/stu3/researchsubject-examples';

// R4 examples
import r4DocumentReferenceExamples from './resources/r4/documentreference-examples';
import r4EncounterExamples from './resources/r4/encounter-examples';
import r4ObservationExamples from './resources/r4/observation-examples';
import r4PatientExamples from './resources/r4/patient-examples';
import r4PractitionnerExamples from './resources/r4/practitioner-examples';
import r4QuestionnaireExamples from './resources/r4/questionnaire-examples';
import r4QuestionnaireResponseExamples from './resources/r4/questionnaireresponse-examples';
import r4DiagnosticReportExamples from './resources/r4/diagnosticreport-examples';
import r4ResearchSubjectExamples from './resources/r4/researchsubject-examples';

import fhirService from '../../src/services/fhirService';
import { FHIR_VERSION_STU3, FHIR_VERSION_R4 } from '../../src/lib/models/fhir/helper';
import sinon from 'sinon';

chai.use(sinonChai);
const { expect } = chai;

// includes 'ValueSet' resource, not supported
delete stu3QuestionnaireExamples.QuestionnaireExampleGcs;
// includes ValueSet
delete r4QuestionnaireExamples.QuestionnaireExampleGcs;
// includes Bundle
delete r4QuestionnaireExamples.Questionnaire541276;
// includes ServiceRequest
delete r4QuestionnaireResponseExamples.QuestionnaireresponseExample;
// includes 'Location'
delete r4EncounterExamples.EncounterHomeExample;
// includes 'Bundle', as do many other examples from the HL7 site not in the repo
delete r4DiagnosticReportExamples.DiagnosticreportExample;

// includes 'Bundle'
delete stu3QuestionnaireExamples.QuestionnaireProfileExampleUssgFht;
// includes 'ReferralRequest' resource, not supported
delete stu3QuestionnaireResponseExamples.QuestionnaireresponseExample;
// includes 'Bundle'
delete stu3DiagnosticReportExamples.DiagnosticreportHlaGeneticsResultsExample;
// includes 'FamilyMemberHistory'
delete stu3DiagnosticReportExamples.DiagnosticreportGeneticsExample2Familyhistory;
// includes 'Speciem'
delete stu3DiagnosticReportExamples.DiagnosticreportExampleGhp;
// include 'ProcedureRequest'
delete stu3DiagnosticReportExamples.DiagnosticreportExampleF202Bloodculture;
delete stu3DiagnosticReportExamples.DiagnosticreportExampleF001Bloodexam;

describe('fhir validator', () => {
  describe('getValidator', () => {
    let fhirVersionStub;
    beforeEach(() => {
      fhirVersionStub = sinon.stub(fhirService, 'getFhirVersion');
      fhirVersionStub.returns(FHIR_VERSION_STU3);
    });
    afterEach(() => {
      fhirVersionStub.restore();
    });
    it('successfully calls getValidator for a DocumentReference', done => {
      fhirValidator.getValidator('DocumentReference').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('successfully calls getValidator for a Questionnaire', done => {
      fhirValidator.getValidator('Questionnaire').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('successfully calls getValidator for a QuestionnaireResponse', done => {
      fhirValidator.getValidator('QuestionnaireResponse').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('successfully calls getValidator for a DiagnosticReport', done => {
      fhirValidator.getValidator('DiagnosticReport').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('successfully calls getValidator for a Patient', done => {
      fhirValidator.getValidator('Patient').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('successfully calls getValidator for an Practitioner', done => {
      fhirValidator.getValidator('Practitioner').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('successfully calls getValidator for an Organization', done => {
      fhirValidator.getValidator('Organization').then(res => {
        expect(typeof res).to.equal('function');
        done();
      });
    });

    it('throws an error when calling getValidator for a MedicalPlan', done => {
      fhirValidator.getValidator('MedicalPlan').then(result => {
        expect(result).to.be.false;
        done();
      });
    });
  });

  describe('version 3.01 (STU3)', () => {
    let fhirVersionStub;
    beforeEach(() => {
      fhirVersionStub = sinon.stub(fhirService, 'getFhirVersion');
      fhirVersionStub.returns(FHIR_VERSION_STU3);
    });
    afterEach(() => {
      fhirVersionStub.restore();
    });

    it('fails isValidResourceType for an invalid resource', () => {
      const valid = fhirValidator.isValidResourceType('Document');
      expect(valid).to.not.be.null;
      expect(valid).to.equal(false);
    });

    it('fails isValidResourceType for a resource not support in STU3 mode', () => {
      const valid = fhirValidator.isValidResourceType('Encounter');
      expect(valid).to.not.be.null;
      expect(valid).to.equal(false);
    });

    it('fails to validate with an explicit message if no parameter is provided', async () => {
      let err;
      try {
        // @ts-ignore
        await fhirValidator.validate();
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('No resource provided');
      }
    });

    it('fails to validate with an explicit message if a non-string, non-object parameter is provided', async () => {
      let err;
      try {
        // @ts-ignore
        await fhirValidator.validate([]);
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource needs to be an object.');
      }
    });

    it('fails to validate with an explicit message if a parameter without a resourceType property is provided', async () => {
      let err;
      try {
        await fhirValidator.validate({
          // @ts-ignore
          uselessProperty: 'not a resource type',
        });
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource object does not have a resource type.');
        expect(err.toString()).to.not.contain('Did you mean to submit the .fhirResource property?');
      }
    });

    it('fails to validate with an explicit message if a parameter without a resourceType property is provided but a fhirResource property exists on the object', async () => {
      let err;
      try {
        await fhirValidator.validate({
          // @ts-ignore
          uselessProperty: 'not a resource type',
          fhirResource: {
            why: 'You might want to submit me though',
          },
        });
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource object does not have a resource type.');
        expect(err.toString()).to.contain('Did you mean to submit the .fhirResource property?');
      }
    });

    it("fails to validate if object passed doesn't match the schema", done => {
      const dummyObject = { resourceType: 'DocumentReference', id: 1 };

      fhirValidator
        // @ts-ignore
        .validate(dummyObject)
        .then(() => done(new Error('should have been rejected')))
        .catch(err => {
          expect(err).to.not.be.null;
          done();
        })
        .catch(done);
    });

    const exampleSTU3Collection = {
      DiagnosticReport: stu3DiagnosticReportExamples,
      DocumentReference: stu3DocumentReferenceExamples,
      Organization: stu3OrganizationExamples,
      Patient: stu3PatientExamples,
      Practitioner: stu3PractitionerExamples,
      Questionnaire: stu3QuestionnaireExamples,
      QuestionnaireResponse: stu3QuestionnaireResponseExamples,
      Observation: stu3ObservationExamples,
      ResearchSubject: stu3ResearchSubjectExamples,
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const [exampleDomainName, resourceExamples] of Object.entries(exampleSTU3Collection)) {
      describe(exampleDomainName, () => {
        Object.keys(resourceExamples).forEach(resourceExample => {
          it(`validates the sample ${resourceExample}`, done => {
            fhirValidator
              .validate(resourceExamples[resourceExample])
              .then(res => {
                expect(res).to.equal(true);
                done();
              })
              .catch(done);
          });
        });
      });
    }
  });

  describe('version 4.01 (R4)', () => {
    let fhirVersionStub;
    beforeEach(() => {
      fhirVersionStub = sinon.stub(fhirService, 'getFhirVersion');
      fhirVersionStub.returns(FHIR_VERSION_R4);
    });
    afterEach(() => {
      fhirVersionStub.restore();
    });

    it('fails isValidResourceType for an invalid resource', () => {
      const valid = fhirValidator.isValidResourceType('Document');
      expect(valid).to.not.be.null;
      expect(valid).to.equal(false);
    });

    it('passes isValidResourceType for a resource not supported in STU3 mode', () => {
      const valid = fhirValidator.isValidResourceType('Encounter');
      expect(valid).to.not.be.null;
      expect(valid).to.equal(true);
    });

    it('fails to validate with an explicit message if no parameter is provided', async () => {
      let err;
      try {
        // @ts-ignore
        await fhirValidator.validate();
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('No resource provided');
      }
    });

    it('fails to validate with an explicit message if a non-string, non-object parameter is provided', async () => {
      let err;
      try {
        // @ts-ignore
        await fhirValidator.validate([]);
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource needs to be an object.');
      }
    });

    it('fails to validate with an explicit message if a parameter without a resourceType property is provided', async () => {
      let err;
      try {
        await fhirValidator.validate({
          // @ts-ignore
          uselessProperty: 'not a resource type',
        });
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource object does not have a resource type.');
        expect(err.toString()).to.not.contain('Did you mean to submit the .fhirResource property?');
      }
    });

    it('fails to validate with an explicit message if a parameter without a resourceType property is provided but a fhirResource property exists on the object', async () => {
      let err;
      try {
        await fhirValidator.validate({
          // @ts-ignore
          uselessProperty: 'not a resource type',
          fhirResource: {
            why: 'You might want to submit me though',
          },
        });
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource object does not have a resource type.');
        expect(err.toString()).to.contain('Did you mean to submit the .fhirResource property?');
      }
    });

    it('fails to validate with an explicit message if a resource contains a resource that contains another resource', async () => {
      let err;
      try {
        await fhirValidator.validate({
          resourceType: 'Observation',
          contained: [
            {
              resourceType: 'Patient',
              id: 'pat',
              contained: [
                {
                  resourceType: 'Organization',
                  id: 'org',
                  name: 'Test org',
                },
              ],
              managingOrganization: {
                reference: '#org',
              },
            },
          ],
          // @ts-ignore
          status: 'final',
          code: {
            text: 'example',
          },
          subject: {
            reference: '#pat',
          },
        });
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain(
          'Resource cannot contain resources that themselves contain another set of resources.'
        );
      }
    });

    it('fails to validate with an explicit message if a resource contains a resource that contains another resource in its second container', async () => {
      let err;
      try {
        await fhirValidator.validate({
          resourceType: 'Observation',
          contained: [
            {
              resourceType: 'Practitioner',
              id: 'f204',
              text: {
                status: 'generated',
                div:
                  '<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: f204</p><p><b>identifier</b>: UZI-nummer = 12345678904 (OFFICIAL)</p><p><b>name</b>: Carla Espinosa</p><p><b>telecom</b>: ph: +31715262169(WORK)</p><p><b>address</b>: Walvisbaai 3 Den helder 2333ZA NLD (WORK)</p><p><b>gender</b>: female</p><p><b>birthDate</b>: 05/11/1967</p></div>',
              },
              identifier: [
                {
                  use: 'official',
                  type: {
                    text: 'UZI-nummer',
                  },
                  system: 'urn:oid:2.16.528.1.1007.3.1',
                  value: '12345678904',
                },
              ],
              name: [
                {
                  use: 'usual',
                  text: 'Carla Espinosa',
                },
              ],
              telecom: [
                {
                  system: 'phone',
                  value: '+31715262169',
                  use: 'work',
                },
              ],
              address: [
                {
                  use: 'work',
                  line: ['Walvisbaai 3'],
                  city: 'Den helder',
                  postalCode: '2333ZA',
                  country: 'NLD',
                },
              ],
              gender: 'female',
              birthDate: '1967-11-05',
            },
            {
              resourceType: 'Patient',
              id: 'pat',
              contained: [
                {
                  resourceType: 'Organization',
                  id: 'org',
                  name: 'Test org',
                },
              ],
              managingOrganization: {
                reference: '#org',
              },
            },
          ],
          // @ts-ignore
          status: 'final',
          code: {
            text: 'example',
          },
          subject: {
            reference: '#pat',
          },
        });
      } catch (error) {
        err = error;
      } finally {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain(
          'Resource cannot contain resources that themselves contain another set of resources.'
        );
      }
    });

    const exampleR4Collection = {
      DocumentReference: r4DocumentReferenceExamples,
      Encounter: r4EncounterExamples,
      Observation: r4ObservationExamples,
      Practitioner: r4PractitionnerExamples,
      DiagnosticReport: r4DiagnosticReportExamples,
      Questionnaire: r4QuestionnaireExamples,
      QuestionnaireResponse: r4QuestionnaireResponseExamples,
      Patient: r4PatientExamples,
      ResearchSubject: r4ResearchSubjectExamples,
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const [exampleDomainName, resourceExamples] of Object.entries(exampleR4Collection)) {
      describe(exampleDomainName, () => {
        Object.keys(resourceExamples).forEach(resourceExample => {
          it(`validates the sample ${resourceExample}`, done => {
            fhirValidator
              .validate(resourceExamples[resourceExample])
              .then(res => {
                expect(res).to.equal(true);
                done();
              })
              .catch(done);
          });
        });
      });
    }
  });
});
