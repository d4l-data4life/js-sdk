/* eslint-env mocha */
/* eslint-disable lodash/prefer-lodash-typecheck,max-nested-callbacks,max-len */
/* eslint-disable no-unused-expressions */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import fhirValidator from '../../src/lib/fhirValidator';

// STU3 examples

// includes 'Observation' resource, not supported
// import diagnosticReportExampleSTU31 from './resources/diagnosticreport-example.json';
import diagnosticReportExampleSTU3DXABoneDensity from './resources/stu3/diagnosticreport-example-dxa.json';
// includes 'ProcedureRequest' resource, not supported
// import diagnosticReportExampleSTU3BloodExam from './resources/diagnosticreport-example-f001-bloodexam.json';
import diagnosticReportExampleSTU3BrainCT from './resources/stu3/diagnosticreport-example-f201-brainct.json';
// includes 'ProcedureRequest' resource, not supported
// import diagnosticReportExampleSTU3BloodCulture from './resources/diagnosticreport-example-f202-bloodculture.json';
// includes 'Specimen' resource, not supported
// import diagnosticReportExampleSTU3BloodGHP from './resources/diagnosticreport-example-ghp.json';
import diagnosticReportExampleSTU3GinGivalMass from './resources/stu3/diagnosticreport-example-gingival-mass.json';
// includes 'Observation' resource, not supported
// import diagnosticReportExampleSTU3Lipids from './resources/diagnosticreport-example-lipids.json';
import diagnosticReportExampleSTU3PapSmear from './resources/stu3/diagnosticreport-example-papsmear.json';
import diagnosticReportExampleSTU3PGX from './resources/stu3/diagnosticreport-example-pgx.json';
import diagnosticReportExampleSTU3UltraSound from './resources/stu3/diagnosticreport-example-ultrasound.json';
// includes 'Bundle' resource, not supported
// import diagnosticReportExampleSTU3General from './resources/diagnosticreport-examples-general.json';
// includes 'FamilyMemberHistory' resource, not supported
// import diagnosticReportExampleSTU3WithFamilyHistory from './resources/diagnosticreport-genetics-example-2-familyhistory.json';
// includes 'Bundle' resource, not supported
// import diagnosticReportExampleSTU3Genetics from './resources/diagnosticreport-hla-genetics-results-example.json';

import documentReferenceExampleSTU3 from './resources/stu3/documentreference-example.json';

// as we currently have a simplified validation for organizations, not restrictions needed
import organizationExampleSTU31 from './resources/stu3/organization-example.json';
import organizationExampleSTU3BurgersUniversity from './resources/stu3/organization-example-f001-burgers.json';
import organizationExampleSTU3BurgersCardiologyUnit from './resources/stu3/organization-example-f002-burgers-card.json';
import organizationExampleSTU3BurgersENTUnit from './resources/stu3/organization-example-f003-burgers-ENT.json';
import organizationExampleSTU3ArtisUniversity from './resources/stu3/organization-example-f201-aumc.json';
import organizationExampleSTU3BlijdorpMedicalCenter from './resources/stu3/organization-example-f203-bumc.json';
import organizationExampleSTU3Gastroenterology from './resources/stu3/organization-example-gastro.json';
import organizationExampleSTU3GoodHealth from './resources/stu3/organization-example-good-health-care.json';
import organizationExampleSTU3Insurance from './resources/stu3/organization-example-insurer.json';
import organizationExampleSTU3ClinicalLab from './resources/stu3/organization-example-lab.json';
import organizationExampleSTU3ACME from './resources/stu3/organization-example-mmanu.json';

import patientExampleSTU31 from './resources/stu3/patient-example.json';
import patientExampleSTU32 from './resources/stu3/patient-example-a.json';
import patientExampleSTU3Animal from './resources/stu3/patient-example-animal.json';
import patientExampleSTU34 from './resources/stu3/patient-example-b.json';
import patientExampleSTU35 from './resources/stu3/patient-example-c.json';
import patientExampleSTU36 from './resources/stu3/patient-example-chinese.json';
import patientExampleSTU37 from './resources/stu3/patient-example-d.json';
import patientExampleSTU38 from './resources/stu3/patient-example-dicom.json';
import patientExampleSTU39 from './resources/stu3/patient-example-f001-pieter.json';
import patientExampleSTU310 from './resources/stu3/patient-example-f201-roel.json';
import patientExampleSTU311 from './resources/stu3/patient-example-ihe-pcd.json';
import patientExampleSTU3Proband from './resources/stu3/patient-example-proband.json';
import patientExampleSTU313 from './resources/stu3/patient-example-xcda.json';
import patientExampleSTU314 from './resources/stu3/patient-example-xds.json';
// includes 'Bundle' resource, not supported
// import patientExampleSTU315 from './resources/patient-examples-cypress-template.json';
// includes 'Bundle' resource, not supported
// import patientExampleSTU316 from './resources/patient-examples-general.json';
import patientExampleSTU317 from './resources/stu3/patient-genetics-example1.json';
import patientExampleSTU318 from './resources/stu3/patient-glossy-example.json';

import practitionerExampleSTU31 from './resources/stu3/practitioner-example.json';
import practitionerExampleSTU32 from './resources/stu3/practitioner-example-f001-evdb.json';
import practitionerExampleSTU33 from './resources/stu3/practitioner-example-f002-pv.json';
import practitionerExampleSTU34 from './resources/stu3/practitioner-example-f003-mv.json';
import practitionerExampleSTU35 from './resources/stu3/practitioner-example-f004-rb.json';
import practitionerExampleSTU36 from './resources/stu3/practitioner-example-f005-al.json';
import practitionerExampleSTU37 from './resources/stu3/practitioner-example-f006-rvdb.json';
import practitionerExampleSTU38 from './resources/stu3/practitioner-example-f007-sh.json';
import practitionerExampleSTU39 from './resources/stu3/practitioner-example-f201-ab.json';
import practitionerExampleSTU310 from './resources/stu3/practitioner-example-f202-lm.json';
import practitionerExampleSTU311 from './resources/stu3/practitioner-example-f203-jvg.json';
import practitionerExampleSTU312 from './resources/stu3/practitioner-example-f204-ce.json';
import practitionerExampleSTU313 from './resources/stu3/practitioner-example-xcda1.json';
import practitionerExampleSTU314 from './resources/stu3/practitioner-example-xcda-author.json';
// includes 'Bundle' resource, not supported
// import practitionerExampleSTU315 from './resources/practitioner-examples-general.json';

import questionnaireExampleSTU3Cancer from './resources/stu3/questionnaire-example.json';
import questionnaireExampleSTU3Bluebook from './resources/stu3/questionnaire-example-bluebook.json';
import questionnaireExampleSTU3Lifelines from './resources/stu3/questionnaire-example-f201-lifelines.json';
// includes 'ValueSet' resource, not supported
// import questionnaireExampleSTU3GCS from './resources/questionnaire-example-gcs.json';

// includes 'ReferralRequest' resource, not supported
// import questionnaireResponseExampleSTU3Cancer from './resources/questionnaireresponse-example.json';
import questionnaireResponseExampleSTU3Bluebook from './resources/stu3/questionnaireresponse-example-bluebook.json';
import questionnaireResponseExampleSTU3Lifelines from './resources/stu3/questionnaireresponse-example-f201-lifelines.json';
import questionnaireResponseExampleSTU3GCS from './resources/stu3/questionnaireresponse-example-gcs.json';
import questionnaireResponseExampleSTU3FHT from './resources/stu3/questionnaireresponse-example-ussg-fht-answers.json';

import observationExampleSTU3 from './resources/stu3/observation-example.json';
import observationExampleSTU3VisualsPanel from './resources/stu3/observation-example-vitals-panel.json';
import observationExampleSTU3Unsat from './resources/stu3/observation-example-unsat.json';
import observationExampleSTU3SatO2 from './resources/stu3/observation-example-satO2.json';
import observationExampleSTU3SampleData from './resources/stu3/observation-example-sample-data.json';
import observationExampleSTU3RespiratoryRate from './resources/stu3/observation-example-respiratory-rate.json';
import observationExampleSTU3Mbp from './resources/stu3/observation-example-mbp.json';
import observationExampleSTU3HeartRate from './resources/stu3/observation-example-heart-rate.json';
import observationExampleSTU3HeadCircumference from './resources/stu3/observation-example-head-circumference.json';
import observationExampleSTU3Glasgow from './resources/stu3/observation-example-glasgow.json';
import observationExampleSTU3GlasgowQa from './resources/stu3/observation-example-glasgow-qa.json';
import observationExampleSTU3F206Staphylococcus from './resources/stu3/observation-example-f206-staphylococcus.json';
import observationExampleSTU3F205Egfr from './resources/stu3/observation-example-f205-egfr.json';
import observationExampleSTU3F204Creatinine from './resources/stu3/observation-example-f204-creatinine.json';
import observationExampleSTU3F203Bicarbonate from './resources/stu3/observation-example-f203-bicarbonate.json';
import observationExampleSTU3F202Temperature from './resources/stu3/observation-example-f202-temperature.json';
import observationExampleSTU3F005Hemoglobin from './resources/stu3/observation-example-f005-hemoglobin.json';
import observationExampleSTU3F004Erythrocyte from './resources/stu3/observation-example-f004-erythrocyte.json';
import observationExampleSTU3F003Co2 from './resources/stu3/observation-example-f003-co2.json';
import observationExampleSTU3F002Excess from './resources/stu3/observation-example-f002-excess.json';
import observationExampleSTU3F001Glucose from './resources/stu3/observation-example-f001-glucose.json';
import observationExampleSTU3EyeColor from './resources/stu3/observation-example-eye-color.json';
import observationExampleSTU3DateLastmp from './resources/stu3/observation-example-date-lastmp.json';
import observationExampleSTU3BodyTemperature from './resources/stu3/observation-example-body-temperature.json';
import observationExampleSTU3BodyLength from './resources/stu3/observation-example-body-length.json';
import observationExampleSTU3BodyHeight from './resources/stu3/observation-example-body-height.json';
import observationExampleSTU3Bmi from './resources/stu3/observation-example-bmi.json';
import observationExampleSTU3Bmd from './resources/stu3/observation-example-bmd.json';
import observationExampleSTU3Bloodpressure from './resources/stu3/observation-example-bloodpressure.json';
import observationExampleSTU3BloodpressureDar from './resources/stu3/observation-example-bloodpressure-dar.json';
import observationExampleSTU3BloodpressureCancel from './resources/stu3/observation-example-bloodpressure-cancel.json';
import observationExampleSTU320MinuteApgarScore from './resources/stu3/observation-example-20minute-apgar-score.json';
import observationExampleSTU310MinuteApgarScore from './resources/stu3/observation-example-10minute-apgar-score.json';
import observationExampleSTU35MinuteApgarScore from './resources/stu3/observation-example-5minute-apgar-score.json';
import observationExampleSTU32MinuteApgarScore from './resources/stu3/observation-example-2minute-apgar-score.json';
import observationExampleSTU31MinuteApgarScore from './resources/stu3/observation-example-1minute-apgar-score.json';

import researchSubjectExampleSTU3 from './resources/stu3/researchsubject-example.json';

// R4 examples

import documentReferenceExampleR4 from './resources/r4/documentreference-example.json';

import encounterExampleR4 from './resources/r4/encounter-example.json';
// includes 'Location'
// import encounterExampleR4Home from './resources/r4/encounter-home-example.json';
import encounterExampleR4RealWorldF201 from './resources/r4/encounter-example-f201-20130404.json';
import encounterExampleR4RealWorldF202WithExtension from './resources/r4/encounter-example-f202-20130128.json';
import encounterExampleR4RealWorldF203 from './resources/r4/encounter-example-f203-20130311.json';
import encounterExampleR4RealWorldF001Heart from './resources/r4/encounter-example-f001-heart.json';
import encounterExampleR4RealWorldF002Lung from './resources/r4/encounter-example-f002-lung.json';
import encounterExampleR4RealWorldF003Abscess from './resources/r4/encounter-example-f003-abscess.json';
import encounterExampleR4XCDA from './resources/r4/encounter-example-xcda.json';
import encounterExampleR4EmergencyInpatient from './resources/r4/encounter-example-emergency-inpatient.json';

import practitionerExampleR4 from './resources/r4/practitioner-example.json';
import practitionerExampleR4XCDA from './resources/r4/practitioner-example-xcda-author.json';
// includes 'Bundle'
// import practitionerExampleR4General from './resources/r4/practitioner-example-general.json';
import practitionerExampleR4F001EVDB from './resources/r4/practitioner-example-f001-evdb.json';
import practitionerExampleR4F002PV from './resources/r4/practitioner-example-f002-pv.json';
import practitionerExampleR4F003MV from './resources/r4/practitioner-example-f003-mv.json';
import practitionerExampleR4F004RB from './resources/r4/practitioner-example-f004-rb.json';
import practitionerExampleR4F005AL from './resources/r4/practitioner-example-f005-al.json';
import practitionerExampleR4F201AB from './resources/r4/practitioner-example-f201-ab.json';
import practitionerExampleR4F202LM from './resources/r4/practitioner-example-f202-lm.json';
import practitionerExampleR4F203JVG from './resources/r4/practitioner-example-f203-jvg.json';
import practitionerExampleR4F204CE from './resources/r4/practitioner-example-f204-ce.json';
import practitionerExampleR4F006RVDB from './resources/r4/practitioner-example-f006-rvdb.json';
import practitionerExampleR4F007SH from './resources/r4/practitioner-example-f007-sh.json';
import practitionerExampleR4XCDA2 from './resources/r4/practitioner-example-xcda1.json';

import fhirService, { FHIR_VERSION_R4, FHIR_VERSION_STU3 } from '../../src/services/fhirService';
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

    it('fails isValidResourceType for a resource not support in STU3 mode', () => {
      const valid = fhirValidator.isValidResourceType('Encounter');
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

    const exampleSTU3Collection = {
      DiagnosticReport: [
        { diagnosticReportExampleSTU3DXABoneDensity },
        { diagnosticReportExampleSTU3BrainCT },
        { diagnosticReportExampleSTU3GinGivalMass },
        { diagnosticReportExampleSTU3PapSmear },
        { diagnosticReportExampleSTU3PGX },
        { diagnosticReportExampleSTU3UltraSound },
      ],
      DocumentReference: [{ documentReferenceExample: documentReferenceExampleSTU3 }],
      Organization: [
        { organizationExampleSTU31 },
        { organizationExampleSTU3BurgersUniversity },
        { organizationExampleSTU3BurgersCardiologyUnit },
        { organizationExampleSTU3BurgersENTUnit },
        { organizationExampleSTU3ArtisUniversity },
        { organizationExampleSTU3BlijdorpMedicalCenter },
        { organizationExampleSTU3Gastroenterology },
        { organizationExampleSTU3GoodHealth },
        { organizationExampleSTU3Insurance },
        { organizationExampleSTU3ClinicalLab },
        { organizationExampleSTU3ACME },
      ],
      Patient: [
        { patientExampleSTU31 },
        { patientExampleSTU32 },
        { patientExampleSTU3Animal },
        { patientExampleSTU34 },
        { patientExampleSTU35 },
        { patientExampleSTU36 },
        { patientExampleSTU37 },
        { patientExampleSTU38 },
        { patientExampleSTU39 },
        { patientExampleSTU310 },
        { patientExampleSTU311 },
        { patientExampleSTU3Proband },
        { patientExampleSTU313 },
        { patientExampleSTU314 },
        { patientExampleSTU317 },
        { patientExampleSTU318 },
      ],
      Practitioner: [
        { practitionerExampleSTU31 },
        { practitionerExampleSTU32 },
        { practitionerExampleSTU33 },
        { practitionerExampleSTU34 },
        { practitionerExampleSTU35 },
        { practitionerExampleSTU36 },
        { practitionerExampleSTU37 },
        { practitionerExampleSTU38 },
        { practitionerExampleSTU39 },
        { practitionerExampleSTU310 },
        { practitionerExampleSTU311 },
        { practitionerExampleSTU312 },
        { practitionerExampleSTU313 },
        { practitionerExampleSTU314 },
      ],
      Questionnaire: [
        { questionnaireExampleSTU3Cancer },
        { questionnaireExampleSTU3Bluebook },
        { questionnaireExampleSTU3Lifelines },
      ],
      QuestionnaireResponse: [
        { questionnaireResponseExampleSTU3Bluebook },
        { questionnaireResponseExampleSTU3Lifelines },
        { questionnaireResponseExampleSTU3GCS },
        { questionnaireResponseExampleSTU3FHT },
      ],
      Observation: [
        { observationExampleSTU3 },
        { observationExampleSTU3VisualsPanel },
        { observationExampleSTU3Unsat },
        { observationExampleSTU3SatO2 },
        { observationExampleSTU3SampleData },
        { observationExampleSTU3RespiratoryRate },
        { observationExampleSTU3Mbp },
        { observationExampleSTU3HeartRate },
        { observationExampleSTU3HeadCircumference },
        { observationExampleSTU3Glasgow },
        { observationExampleSTU3GlasgowQa },
        { observationExampleSTU3F206Staphylococcus },
        { observationExampleSTU3F205Egfr },
        { observationExampleSTU3F204Creatinine },
        { observationExampleSTU3F203Bicarbonate },
        { observationExampleSTU3F202Temperature },
        { observationExampleSTU3F005Hemoglobin },
        { observationExampleSTU3F004Erythrocyte },
        { observationExampleSTU3F003Co2 },
        { observationExampleSTU3F002Excess },
        { observationExampleSTU3F001Glucose },
        { observationExampleSTU3EyeColor },
        { observationExampleSTU3DateLastmp },
        { observationExampleSTU3BodyTemperature },
        { observationExampleSTU3BodyLength },
        { observationExampleSTU3BodyHeight },
        { observationExampleSTU3Bmi },
        { observationExampleSTU3Bmd },
        { observationExampleSTU3Bloodpressure },
        { observationExampleSTU3BloodpressureDar },
        { observationExampleSTU3BloodpressureCancel },
        { observationExampleSTU320MinuteApgarScore },
        { observationExampleSTU310MinuteApgarScore },
        { observationExampleSTU35MinuteApgarScore },
        { observationExampleSTU32MinuteApgarScore },
        { observationExampleSTU31MinuteApgarScore },
      ],
      ResearchSubject: [{ researchsubjectExample: researchSubjectExampleSTU3 }],
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const [exampleDomainName, resourceExamples] of Object.entries(exampleSTU3Collection)) {
      describe(exampleDomainName, () => {
        afterEach(() => {
          fhirValidator.clearValidator(exampleDomainName);
        });
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

    const exampleR4Collection = {
      DocumentReference: [{ documentReferenceExampleR4 }],
      Encounter: [
        { encounterExampleR4 },
        { encounterExampleR4RealWorldF201 },
        { encounterExampleR4RealWorldF202WithExtension },
        { encounterExampleR4RealWorldF203 },
        { encounterExampleR4RealWorldF001Heart },
        { encounterExampleR4RealWorldF002Lung },
        { encounterExampleR4RealWorldF003Abscess },
        { encounterExampleR4XCDA },
        { encounterExampleR4EmergencyInpatient },
      ],
      Practitioner: [
        { practitionerExampleR4 },
        { practitionerExampleR4XCDA },
        { practitionerExampleR4F001EVDB },
        { practitionerExampleR4F002PV },
        { practitionerExampleR4F003MV },
        { practitionerExampleR4F004RB },
        { practitionerExampleR4F005AL },
        { practitionerExampleR4F201AB },
        { practitionerExampleR4F202LM },
        { practitionerExampleR4F203JVG },
        { practitionerExampleR4F204CE },
        { practitionerExampleR4F006RVDB },
        { practitionerExampleR4F007SH },
        { practitionerExampleR4XCDA2 },
      ],
    };

    // todo: refactor to share

    // eslint-disable-next-line no-restricted-syntax
    for (const [exampleDomainName, resourceExamples] of Object.entries(exampleR4Collection)) {
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
