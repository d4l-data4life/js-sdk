/* eslint-env mocha */
/* eslint-disable lodash/prefer-lodash-typecheck,max-nested-callbacks,max-len */
/* eslint-disable no-unused-expressions */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import fhirValidator from '../../src/lib/fhirValidator';

// includes 'Observation' resource, not supported
// import diagnosticReportExample1 from './resources/diagnosticreport-example.json';
import diagnosticReportExampleDXABoneDensity from './resources/diagnosticreport-example-dxa.json';
// includes 'ProcedureRequest' resource, not supported
// import diagnosticReportExampleBloodExam from './resources/diagnosticreport-example-f001-bloodexam.json';
import diagnosticReportExampleBrainCT from './resources/diagnosticreport-example-f201-brainct.json';
// includes 'ProcedureRequest' resource, not supported
// import diagnosticReportExampleBloodCulture from './resources/diagnosticreport-example-f202-bloodculture.json';
// includes 'Specimen' resource, not supported
// import diagnosticReportExampleBloodGHP from './resources/diagnosticreport-example-ghp.json';
import diagnosticReportExampleGinGivalMass from './resources/diagnosticreport-example-gingival-mass.json';
// includes 'Observation' resource, not supported
// import diagnosticReportExampleLipids from './resources/diagnosticreport-example-lipids.json';
import diagnosticReportExamplePapSmear from './resources/diagnosticreport-example-papsmear.json';
import diagnosticReportExamplePGX from './resources/diagnosticreport-example-pgx.json';
import diagnosticReportExampleUltraSound from './resources/diagnosticreport-example-ultrasound.json';
// includes 'Bundle' resource, not supported
// import diagnosticReportExampleGeneral from './resources/diagnosticreport-examples-general.json';
// includes 'FamilyMemberHistory' resource, not supported
// import diagnosticReportExampleWithFamilyHistory from './resources/diagnosticreport-genetics-example-2-familyhistory.json';
// includes 'Bundle' resource, not supported
// import diagnosticReportExampleGenetics from './resources/diagnosticreport-hla-genetics-results-example.json';

import documentReferenceExample from './resources/documentreference-example.json';

// as we currently have a simplified validation for organizations, not restrictions needed
import organizationExample1 from './resources/organization-example.json';
import organizationExampleBurgersUniversity from './resources/organization-example-f001-burgers.json';
import organizationExampleBurgersCardiologyUnit from './resources/organization-example-f002-burgers-card.json';
import organizationExampleBurgersENTUnit from './resources/organization-example-f003-burgers-ENT.json';
import organizationExampleArtisUniversity from './resources/organization-example-f201-aumc.json';
import organizationExampleBlijdorpMedicalCenter from './resources/organization-example-f203-bumc.json';
import organizationExampleGastroenterology from './resources/organization-example-gastro.json';
import organizationExampleGoodHealth from './resources/organization-example-good-health-care.json';
import organizationExampleInsurance from './resources/organization-example-insurer.json';
import organizationExampleClinicalLab from './resources/organization-example-lab.json';
import organizationExampleACME from './resources/organization-example-mmanu.json';

import patientExample1 from './resources/patient-example.json';
import patientExample2 from './resources/patient-example-a.json';
import patientExampleAnimal from './resources/patient-example-animal.json';
import patientExample4 from './resources/patient-example-b.json';
import patientExample5 from './resources/patient-example-c.json';
import patientExample6 from './resources/patient-example-chinese.json';
import patientExample7 from './resources/patient-example-d.json';
import patientExample8 from './resources/patient-example-dicom.json';
import patientExample9 from './resources/patient-example-f001-pieter.json';
import patientExample10 from './resources/patient-example-f201-roel.json';
import patientExample11 from './resources/patient-example-ihe-pcd.json';
import patientExampleProband from './resources/patient-example-proband.json';
import patientExample13 from './resources/patient-example-xcda.json';
import patientExample14 from './resources/patient-example-xds.json';
// includes 'Bundle' resource, not supported
// import patientExample15 from './resources/patient-examples-cypress-template.json';
// includes 'Bundle' resource, not supported
// import patientExample16 from './resources/patient-examples-general.json';
import patientExample17 from './resources/patient-genetics-example1.json';
import patientExample18 from './resources/patient-glossy-example.json';

import practitionerExample1 from './resources/practitioner-example.json';
import practitionerExample2 from './resources/practitioner-example-f001-evdb.json';
import practitionerExample3 from './resources/practitioner-example-f002-pv.json';
import practitionerExample4 from './resources/practitioner-example-f003-mv.json';
import practitionerExample5 from './resources/practitioner-example-f004-rb.json';
import practitionerExample6 from './resources/practitioner-example-f005-al.json';
import practitionerExample7 from './resources/practitioner-example-f006-rvdb.json';
import practitionerExample8 from './resources/practitioner-example-f007-sh.json';
import practitionerExample9 from './resources/practitioner-example-f201-ab.json';
import practitionerExample10 from './resources/practitioner-example-f202-lm.json';
import practitionerExample11 from './resources/practitioner-example-f203-jvg.json';
import practitionerExample12 from './resources/practitioner-example-f204-ce.json';
import practitionerExample13 from './resources/practitioner-example-xcda1.json';
import practitionerExample14 from './resources/practitioner-example-xcda-author.json';
// includes 'Bundle' resource, not supported
// import practitionerExample15 from './resources/practitioner-examples-general.json';

import questionnaireExampleCancer from './resources/questionnaire-example.json';
import questionnaireExampleBluebook from './resources/questionnaire-example-bluebook.json';
import questionnaireExampleLifelines from './resources/questionnaire-example-f201-lifelines.json';
// includes 'ValueSet' resource, not supported
// import questionnaireExampleGCS from './resources/questionnaire-example-gcs.json';

// includes 'ReferralRequest' resource, not supported
// import questionnaireResponseExampleCancer from './resources/questionnaireresponse-example.json';
import questionnaireResponseExampleBluebook from './resources/questionnaireresponse-example-bluebook.json';
import questionnaireResponseExampleLifelines from './resources/questionnaireresponse-example-f201-lifelines.json';
import questionnaireResponseExampleGCS from './resources/questionnaireresponse-example-gcs.json';
import questionnaireResponseExampleFHT from './resources/questionnaireresponse-example-ussg-fht-answers.json';

import observationExample from './resources/observation-example.json';
import observationExampleVisualsPanel from './resources/observation-example-vitals-panel.json';
import observationExampleUnsat from './resources/observation-example-unsat.json';
import observationExampleSatO2 from './resources/observation-example-satO2.json';
import observationExampleSampleData from './resources/observation-example-sample-data.json';
import observationExampleRespiratoryRate from './resources/observation-example-respiratory-rate.json';
import observationExampleMbp from './resources/observation-example-mbp.json';
import observationExampleHeartRate from './resources/observation-example-heart-rate.json';
import observationExampleHeadCircumference from './resources/observation-example-head-circumference.json';
import observationExampleGlasgow from './resources/observation-example-glasgow.json';
import observationExampleGlasgowQa from './resources/observation-example-glasgow-qa.json';
import observationExampleF206Staphylococcus from './resources/observation-example-f206-staphylococcus.json';
import observationExampleF205Egfr from './resources/observation-example-f205-egfr.json';
import observationExampleF204Creatinine from './resources/observation-example-f204-creatinine.json';
import observationExampleF203Bicarbonate from './resources/observation-example-f203-bicarbonate.json';
import observationExampleF202Temperature from './resources/observation-example-f202-temperature.json';
import observationExampleF005Hemoglobin from './resources/observation-example-f005-hemoglobin.json';
import observationExampleF004Erythrocyte from './resources/observation-example-f004-erythrocyte.json';
import observationExampleF003Co2 from './resources/observation-example-f003-co2.json';
import observationExampleF002Excess from './resources/observation-example-f002-excess.json';
import observationExampleF001Glucose from './resources/observation-example-f001-glucose.json';
import observationExampleEyeColor from './resources/observation-example-eye-color.json';
import observationExampleDateLastmp from './resources/observation-example-date-lastmp.json';
import observationExampleBodyTemperature from './resources/observation-example-body-temperature.json';
import observationExampleBodyLength from './resources/observation-example-body-length.json';
import observationExampleBodyHeight from './resources/observation-example-body-height.json';
import observationExampleBmi from './resources/observation-example-bmi.json';
import observationExampleBmd from './resources/observation-example-bmd.json';
import observationExampleBloodpressure from './resources/observation-example-bloodpressure.json';
import observationExampleBloodpressureDar from './resources/observation-example-bloodpressure-dar.json';
import observationExampleBloodpressureCancel from './resources/observation-example-bloodpressure-cancel.json';
import observationExample20MinuteApgarScore from './resources/observation-example-20minute-apgar-score.json';
import observationExample10MinuteApgarScore from './resources/observation-example-10minute-apgar-score.json';
import observationExample5MinuteApgarScore from './resources/observation-example-5minute-apgar-score.json';
import observationExample2MinuteApgarScore from './resources/observation-example-2minute-apgar-score.json';
import observationExample1MinuteApgarScore from './resources/observation-example-1minute-apgar-score.json';

import researchsubjectExample from './resources/researchsubject-example.json';
import fhirService, { FHIR_VERSION_STU3 } from '../../src/services/fhirService';
import sinon from 'sinon';

// @ts-ignore-disable

chai.use(sinonChai);

const { expect } = chai;

describe('fhir validator', () => {
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

    it('fails to validate with an explicit message if no parameter is provided', done => {
      try {
        // @ts-ignore
        fhirValidator.validate();
        done();
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('No resource provided');
        done();
      }
    });

    it('fails to validate with an explicit message if a non-string, non-object parameter is provided', done => {
      try {
        // @ts-ignore
        fhirValidator.validate([]);
        done();
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource needs to be an object.');
        done();
      }
    });

    it('fails to validate with an explicit message if a parameter without a resourceType property is provided', done => {
      try {
        fhirValidator.validate({
          // @ts-ignore
          uselessProperty: 'not a resource type',
        });
        done();
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource object does not have a resource type.');
        expect(err.toString()).to.not.contain('Did you mean to submit the .fhirResource property?');
        done();
      }
    });

    it('fails to validate with an explicit message if a parameter without a resourceType property is provided but a fhirResource property exists on the object', done => {
      try {
        fhirValidator.validate({
          // @ts-ignore
          uselessProperty: 'not a resource type',
          fhirResource: {
            why: 'You might want to submit me though',
          },
        });
        done();
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err instanceof Error).to.be.true;
        expect(Array.isArray(err.errors)).to.be.true;
        expect(err.toString()).to.contain('Resource object does not have a resource type.');
        expect(err.toString()).to.contain('Did you mean to submit the .fhirResource property?');
        done();
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

    const exampleCollection = {
      DiagnosticReport: [
        { diagnosticReportExampleDXABoneDensity },
        { diagnosticReportExampleBrainCT },
        { diagnosticReportExampleGinGivalMass },
        { diagnosticReportExamplePapSmear },
        { diagnosticReportExamplePGX },
        { diagnosticReportExampleUltraSound },
      ],
      DocumentReference: [{ documentReferenceExample }],
      Organization: [
        { organizationExample1 },
        { organizationExampleBurgersUniversity },
        { organizationExampleBurgersCardiologyUnit },
        { organizationExampleBurgersENTUnit },
        { organizationExampleArtisUniversity },
        { organizationExampleBlijdorpMedicalCenter },
        { organizationExampleGastroenterology },
        { organizationExampleGoodHealth },
        { organizationExampleInsurance },
        { organizationExampleClinicalLab },
        { organizationExampleACME },
      ],
      Patient: [
        { patientExample1 },
        { patientExample2 },
        { patientExampleAnimal },
        { patientExample4 },
        { patientExample5 },
        { patientExample6 },
        { patientExample7 },
        { patientExample8 },
        { patientExample9 },
        { patientExample10 },
        { patientExample11 },
        { patientExampleProband },
        { patientExample13 },
        { patientExample14 },
        { patientExample17 },
        { patientExample18 },
      ],
      Practitioner: [
        { practitionerExample1 },
        { practitionerExample2 },
        { practitionerExample3 },
        { practitionerExample4 },
        { practitionerExample5 },
        { practitionerExample6 },
        { practitionerExample7 },
        { practitionerExample8 },
        { practitionerExample9 },
        { practitionerExample10 },
        { practitionerExample11 },
        { practitionerExample12 },
        { practitionerExample13 },
        { practitionerExample14 },
      ],
      Questionnaire: [
        { questionnaireExampleCancer },
        { questionnaireExampleBluebook },
        { questionnaireExampleLifelines },
      ],
      QuestionnaireResponse: [
        { questionnaireResponseExampleBluebook },
        { questionnaireResponseExampleLifelines },
        { questionnaireResponseExampleGCS },
        { questionnaireResponseExampleFHT },
      ],
      Observation: [
        { observationExample },
        { observationExampleVisualsPanel },
        { observationExampleUnsat },
        { observationExampleSatO2 },
        { observationExampleSampleData },
        { observationExampleRespiratoryRate },
        { observationExampleMbp },
        { observationExampleHeartRate },
        { observationExampleHeadCircumference },
        { observationExampleGlasgow },
        { observationExampleGlasgowQa },
        { observationExampleF206Staphylococcus },
        { observationExampleF205Egfr },
        { observationExampleF204Creatinine },
        { observationExampleF203Bicarbonate },
        { observationExampleF202Temperature },
        { observationExampleF005Hemoglobin },
        { observationExampleF004Erythrocyte },
        { observationExampleF003Co2 },
        { observationExampleF002Excess },
        { observationExampleF001Glucose },
        { observationExampleEyeColor },
        { observationExampleDateLastmp },
        { observationExampleBodyTemperature },
        { observationExampleBodyLength },
        { observationExampleBodyHeight },
        { observationExampleBmi },
        { observationExampleBmd },
        { observationExampleBloodpressure },
        { observationExampleBloodpressureDar },
        { observationExampleBloodpressureCancel },
        { observationExample20MinuteApgarScore },
        { observationExample10MinuteApgarScore },
        { observationExample5MinuteApgarScore },
        { observationExample2MinuteApgarScore },
        { observationExample1MinuteApgarScore },
      ],
      ResearchSubject: [{ researchsubjectExample }],
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const [exampleDomainName, resourceExamples] of Object.entries(exampleCollection)) {
      describe(exampleDomainName, () => {
        resourceExamples.forEach(resourceExample => {
          it(`validates the sample ${Object.keys(resourceExample)[0]}`, done => {
            fhirValidator
              .validate(Object.values(resourceExample)[0])
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
