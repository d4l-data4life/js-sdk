/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fhirService, {
  convertToExposedRecord,
  prepareSearchParameters,
} from '../../src/services/fhirService';
import testVariables from '../testUtils/testVariables';
import fhirValidator from '../../src/lib/fhirValidator';
import stu3FhirResources from '../testUtils/stu3FhirResources';
import recordService from '../../src/services/recordService';
import DocumentReference from '../../src/lib/models/fhir/DocumentReference';
import { FHIR_VERSION_STU3, FHIR_VERSION_R4 } from '../../src/lib/models/fhir/helper';
import { setAttachmentsToResource } from '../../src/services/attachmentService';

chai.use(sinonChai);

const { expect } = chai;

describe('prepareSearchParameters', () => {
  it('correctly prepares simple parameters', () => {
    const preparedParams = prepareSearchParameters({ params: { limit: 4, offset: 3 } });
    expect(preparedParams).to.deep.equal({
      limit: 4,
      offset: 3,
      tags: [],
    });
  });

  it('correctly prepares simple parameters with a tag', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        limit: 10,
        tags: ['superhero-origin-story'],
      },
    });
    expect(preparedParams).to.deep.equal({
      limit: 10,
      tags: ['superhero-origin-story'],
    });
  });

  it('correctly prepares simple parameters with a tag and annotation', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        limit: 10,
        tags: ['superhero-origin-story'],
        annotations: ['an annotation'],
      },
    });
    expect(preparedParams).to.deep.equal({
      limit: 10,
      tags: ['superhero-origin-story', 'custom=an%20annotation'],
    });
  });

  it('correctly prepares parameters with a tag and a resourceType', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        limit: 10,
        tags: ['superhero-origin-story'],
        resourceType: 'Patient',
      },
    });
    expect(preparedParams).to.deep.equal({
      limit: 10,
      tags: ['superhero-origin-story', 'resourcetype=patient'],
    });
  });

  it('correctly prepares parameters with a tag and a partner', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        offset: 20,
        tags: ['superhero-origin-story'],
        partner: 'S.H.I.E.L.D.',
      },
    });
    expect(preparedParams).to.deep.equal({
      offset: 20,
      tags: ['superhero-origin-story', 'partner=s%2eh%2ei%2ee%2el%2ed%2e'],
    });
  });

  it('correctly prepares parameters with exclude_tags', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        tags: ['superhero-origin-story'],
        exclude_tags: ['superman'],
      },
    });
    expect(preparedParams).to.deep.equal({
      tags: ['superhero-origin-story'],
      exclude_tags: ['custom=superman'],
    });
  });

  it('correctly prepares parameters with exclude_flags', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        tags: ['superhero-origin-story'],
        exclude_flags: [testVariables.appDataFlag],
      },
    });
    expect(preparedParams).to.deep.equal({
      tags: ['superhero-origin-story'],
      exclude_tags: [testVariables.appDataFlag],
    });
  });

  it('correctly prepares parameters with exclude_tags and exclude_flags', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        tags: ['superhero-origin-story'],
        exclude_tags: ['superman'],
        exclude_flags: [testVariables.appDataFlag],
      },
    });
    expect(preparedParams).to.deep.equal({
      tags: ['superhero-origin-story'],
      exclude_tags: ['custom=superman', testVariables.appDataFlag],
    });
  });

  it('correctly prepares a non-fallback fhir version tag', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        tags: ['superhero-origin-story'],
        exclude_tags: ['superman'],
        exclude_flags: [testVariables.appDataFlag],
        fhirVersion: '3.0.1',
      },
      fallbackMode: null,
    });
    expect(preparedParams).to.deep.equal({
      tags: ['superhero-origin-story', 'fhirversion=3%2e0%2e1'],
      exclude_tags: ['custom=superman', testVariables.appDataFlag],
    });
  });

  it('correctly prepares a fallback fhir version tag', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        tags: ['superhero-origin-story'],
        exclude_tags: ['superman'],
        exclude_flags: [testVariables.appDataFlag],
        fhirVersion: '4.0.1',
      },
      fallbackMode: 'fhirversion',
    });
    expect(preparedParams).to.deep.equal({
      tags: ['superhero-origin-story', 'fhirversion=4.0.1'],
      exclude_tags: ['custom=superman', testVariables.appDataFlag],
    });
  });

  it('correctly prepares a fallback annotation', () => {
    const preparedParams = prepareSearchParameters({
      params: {
        tags: ['wanda-vision'],
        annotations: ['***it was: agatha all along***'],
        exclude_tags: ['superman'],
        exclude_flags: [testVariables.appDataFlag],
        fhirVersion: '4.0.1',
      },
      fallbackMode: 'annotation',
    });
    expect(preparedParams).to.deep.equal({
      tags: [
        'wanda-vision',
        'custom=%2a%2a%2ait%20was%3A%20agatha%20all%20along%2a%2a%2a',
        'fhirversion=4%2e0%2e1',
      ],
      exclude_tags: ['custom=superman', testVariables.appDataFlag],
    });
  });

  it('throws when an unsupported parameter is passed', () => {
    // @ts-ignore
    expect(() => prepareSearchParameters({ illegalTag: 'suchIllegalMuchEvil' })).to.throw();
  });
});

describe('setAttachmentsToResource', () => {
  const attachments = [{ image: 'simpleImage' }, { document: 'pdf' }];
  it('should return a DocumentReference with Attachments set', () => {
    const documentReference = {
      resourceType: 'DocumentReference',
    };
    const originalDocumentReference = JSON.parse(JSON.stringify(documentReference));
    // @ts-ignore
    const updatedDocumentReference = setAttachmentsToResource(documentReference, attachments);
    expect(updatedDocumentReference).to.deep.equal({
      resourceType: 'DocumentReference',
      content: [{ attachment: { image: 'simpleImage' } }, { attachment: { document: 'pdf' } }],
    });
    expect(documentReference).to.deep.equal(originalDocumentReference);
  });

  it('should return the DocumentReference given, when attachments is an empty array', () => {
    const documentReference = {
      resourceType: 'DocumentReference',
    };

    const updatedDocumentReference = setAttachmentsToResource(documentReference, []);
    expect(updatedDocumentReference).to.deep.equal({
      resourceType: 'DocumentReference',
      content: [],
    });
    expect(documentReference).to.deep.equal({ resourceType: 'DocumentReference' });
  });

  it('should return a Patient with Attachments set', () => {
    const patient = {
      resourceType: 'Patient',
    };
    const originalPatient = JSON.parse(JSON.stringify(patient));
    // @ts-ignore
    const updatedPatient = setAttachmentsToResource(patient, attachments);
    expect(updatedPatient).to.deep.equal({
      resourceType: 'Patient',
      photo: [{ image: 'simpleImage' }, { document: 'pdf' }],
    });
    expect(patient).to.deep.equal(originalPatient);
  });

  it('should return a Practitioner with Attachments set', () => {
    const practitioner = {
      resourceType: 'Practitioner',
    };
    const originalPractitioner = JSON.parse(JSON.stringify(practitioner));
    // @ts-ignore
    const updatedPractitioner = setAttachmentsToResource(practitioner, attachments);
    expect(updatedPractitioner).to.deep.equal({
      resourceType: 'Practitioner',
      photo: [{ image: 'simpleImage' }, { document: 'pdf' }],
    });
    expect(practitioner).to.deep.equal(originalPractitioner);
  });

  it('should return a Medication with Attachments set', () => {
    const medication = {
      resourceType: 'Medication',
    };
    const originalMedication = JSON.parse(JSON.stringify(medication));
    // @ts-ignore
    const updatedPractitioner = setAttachmentsToResource(medication, attachments);
    expect(updatedPractitioner).to.deep.equal({
      resourceType: 'Medication',
      image: [{ image: 'simpleImage' }, { document: 'pdf' }],
    });
    expect(medication).to.deep.equal(originalMedication);
  });

  it('should return a DiagnosticReport with Attachments set', () => {
    const diagnosticReport = {
      resourceType: 'DiagnosticReport',
    };
    const originalDiagnosticReport = JSON.parse(JSON.stringify(diagnosticReport));
    // @ts-ignore
    const updatedDiagnosticReport = setAttachmentsToResource(diagnosticReport, attachments);
    expect(updatedDiagnosticReport).to.deep.equal({
      resourceType: 'DiagnosticReport',
      presentedForm: [{ image: 'simpleImage' }, { document: 'pdf' }],
    });
    expect(diagnosticReport).to.deep.equal(originalDiagnosticReport);
  });
});

describe('convertToExposedRecord', () => {
  const userId = 'user_id';
  const recordId = 'record_id';
  const customCreationDate = new Date('2017-09-19');
  const updatedDate = new Date('2017-09-19T09:29:48.278');

  const decryptedRecord = {
    id: recordId,
    customCreationDate,
    user_id: userId,
    fhirResource: stu3FhirResources.carePlan,
    tags: ['tag1', 'tag2', testVariables.secondTag],
    version: 1,
    status: 'Active',
    updatedDate,
  };

  it('correctly converts a decrypted to an exposed record', () => {
    const exposedRecord = convertToExposedRecord(decryptedRecord);

    expect(exposedRecord.id).to.equal(recordId);
    expect(exposedRecord.customCreationDate.getTime()).to.equal(customCreationDate.getTime());
    expect(exposedRecord.updatedDate.getTime()).to.equal(updatedDate.getTime());
    Object.keys(exposedRecord.fhirResource).forEach(key => {
      if (key !== 'id') {
        expect(JSON.stringify(exposedRecord.fhirResource[key])).to.equal(
          JSON.stringify(stu3FhirResources.carePlan[key])
        );
      }
    });
    expect(exposedRecord.fhirResource.id).to.equal(recordId);
    expect(exposedRecord.partner).to.equal('1');
    expect(JSON.stringify(exposedRecord.annotations)).to.equal(JSON.stringify([]));
  });
});

describe('fhirService', () => {
  let createRecordStub;
  let fhirValidatorStub;
  let updateRecordStub;
  let downloadRecordStub;
  let searchRecordsStub;

  const userId = 'user_id';
  const recordId = 'record_id';

  const decryptedRecord = {
    id: recordId,
    customCreationDate: new Date('2017-09-19'),
    user_id: userId,
    fhirResource: stu3FhirResources.carePlan,
    tags: ['tag1', 'tag2', testVariables.secondTag],
    version: 1,
    status: 'Active',
    updatedDate: new Date('2017-09-19T09:29:48.278'),
  };

  const record = {
    id: recordId,
    customCreationDate: new Date('2017-09-19'),
    fhirResource: stu3FhirResources.carePlan,
    updatedDate: new Date('2017-09-19T09:29:48.278'),
    annotations: [],
    partner: '1',
  };

  const badResource = {
    type: 'invalidType',
    numberProp: 2,
  };

  beforeEach(() => {
    createRecordStub = sinon
      .stub(recordService, 'createRecord')
      .returns(Promise.resolve(decryptedRecord));
    updateRecordStub = sinon
      .stub(recordService, 'updateRecord')
      .returns(Promise.resolve(decryptedRecord));
    downloadRecordStub = sinon
      .stub(recordService, 'downloadRecord')
      // eslint-disable-next-line prefer-promise-reject-errors
      .returns(Promise.reject('error'));
    downloadRecordStub.withArgs(userId, recordId).returns(Promise.resolve(decryptedRecord));
    fhirValidatorStub = sinon.stub(fhirValidator, 'validate').returns(Promise.resolve(true));

    searchRecordsStub = sinon.stub(recordService, 'searchRecords').returns(
      Promise.resolve({
        totalCount: 1,
        records: [decryptedRecord],
      })
    );
  });

  it('sets and gets the fhirVersion correctly', done => {
    fhirService.setFhirVersion(FHIR_VERSION_R4);
    expect(fhirService.getFhirVersion()).to.equal(FHIR_VERSION_R4);
    done();
  });

  describe('fetchResource', () => {
    it('should fetch resource', done => {
      fhirService
        .fetchResource(userId, recordId)
        .then(result => {
          expect(downloadRecordStub).to.be.calledWith(userId, recordId);
          expect(downloadRecordStub).to.be.calledOnce;
          expect(result).to.exist;
        })
        .then(done)
        .catch(done);
    });

    it('should fail to fetch on invalid resource id', done => {
      fhirService.fetchResource(userId, 'invalid_record_id').catch(error => {
        expect(error).to.equal('error');
        done();
      });
    });
  });

  describe('createResource', () => {
    it('should create resource with a valid input and tag it with the correct FHIR version (STU3)', done => {
      fhirService.setFhirVersion(FHIR_VERSION_STU3);
      const d4lResource = { resourceType: 'CarePlan', id: 'record_id' };
      fhirService
        .createResource(userId, d4lResource)
        .then(res => {
          expect(createRecordStub).to.be.calledWith(userId);
          const { args } = createRecordStub.getCall(0);
          expect(args[1].tags.toString()).to.contain('fhirversion=3%2e0%2e1');
          expect(createRecordStub).to.be.calledOnce;
          Object.keys(record.fhirResource).forEach(key => {
            if (key !== 'id') {
              expect(JSON.stringify(record.fhirResource[key])).to.equal(
                JSON.stringify(res.fhirResource[key])
              );
            }
          });
          done();
        })
        .catch(done);
    });

    it('should create resource with a valid input and tag it with the correct FHIR version (R4)', done => {
      fhirService.setFhirVersion(FHIR_VERSION_R4);
      const d4lResource = { resourceType: 'Encounter', id: 'record_id' };
      fhirService
        .createResource(userId, d4lResource)
        .then(res => {
          expect(createRecordStub).to.be.calledWith(userId);
          const { args } = createRecordStub.getCall(0);
          expect(args[1].tags.toString()).to.contain('fhirversion=4%2e0%2e1');
          expect(createRecordStub).to.be.calledOnce;
          Object.keys(record.fhirResource).forEach(key => {
            if (key !== 'id') {
              expect(JSON.stringify(record.fhirResource[key])).to.equal(
                JSON.stringify(res.fhirResource[key])
              );
            }
          });
          done();
        })
        .catch(done);
    });

    it('should reject the resource creation with an invalid input', done => {
      fhirValidatorStub.returns(false);
      fhirService
        // @ts-ignore
        .createResource(userId, badResource)
        .catch(err => {
          expect(err).to.not.be.null;
          expect(err.toString()).to.contain(
            'Called createResource with an invalid fhirResource parameter.'
          );
          expect(fhirValidatorStub).to.be.calledOnce;
          expect(createRecordStub).to.not.be.called;
          done();
        })
        .catch(done);
      fhirValidatorStub.restore();
    });
  });

  describe('updateResource', () => {
    it('should update a resource correctly when no annotations are added', done => {
      const d4lResource = Object.assign(
        {
          id: testVariables.recordId,
        },
        stu3FhirResources.carePlan
      );
      const customCreationDate = new Date();
      fhirService
        .updateResource(userId, d4lResource, customCreationDate)
        .then(res => {
          expect(updateRecordStub).to.be.calledOnce;
          expect(updateRecordStub).to.be.calledWith(userId, {
            id: d4lResource.id,
            fhirResource: d4lResource,
            tags: undefined,
            attachmentKey: undefined,
            customCreationDate,
          });
          Object.keys(record.fhirResource).forEach(key => {
            if (key !== 'id') {
              expect(JSON.stringify(record.fhirResource[key])).to.equal(
                JSON.stringify(res.fhirResource[key])
              );
            }
          });
          done();
        })
        .catch(done);
    });

    it('should update a resource correctly when annotations are added', done => {
      const d4lResource = Object.assign(
        {
          id: testVariables.recordId,
        },
        stu3FhirResources.carePlan
      );
      const customCreationDate = new Date();
      fhirService
        .updateResource(userId, d4lResource, customCreationDate, ['addme'])
        .then(res => {
          expect(updateRecordStub).to.be.calledOnce;
          expect(updateRecordStub).to.be.calledWith(userId, {
            id: d4lResource.id,
            fhirResource: d4lResource,
            tags: ['custom=addme'],
            attachmentKey: undefined,
            customCreationDate,
          });
          Object.keys(record.fhirResource).forEach(key => {
            if (key !== 'id') {
              expect(JSON.stringify(record.fhirResource[key])).to.equal(
                JSON.stringify(res.fhirResource[key])
              );
            }
          });
          done();
        })
        .catch(done);
    });

    it('should update a resource correctly when an empty annotations array is added', done => {
      const d4lResource = Object.assign(
        {
          id: testVariables.recordId,
        },
        stu3FhirResources.carePlan
      );
      const customCreationDate = new Date();
      fhirService
        .updateResource(userId, d4lResource, customCreationDate, [])
        .then(res => {
          expect(updateRecordStub).to.be.calledOnce;
          expect(updateRecordStub).to.be.calledWith(userId, {
            id: d4lResource.id,
            fhirResource: d4lResource,
            tags: [],
            attachmentKey: undefined,
            customCreationDate,
          });
          Object.keys(record.fhirResource).forEach(key => {
            if (key !== 'id') {
              expect(JSON.stringify(record.fhirResource[key])).to.equal(
                JSON.stringify(res.fhirResource[key])
              );
            }
          });
          done();
        })
        .catch(done);
    });

    it('should reject a resource without an id', done => {
      const d4lResource = Object.assign({}, stu3FhirResources.carePlan);
      // @ts-ignore
      delete d4lResource.id;
      fhirService
        // @ts-ignore
        .updateResource(userId, d4lResource)
        .catch(err => {
          expect(err).to.not.be.null;
          expect(updateRecordStub).to.not.be.called;
          expect(err.toString()).to.contain('No parameter id found in resource to update');
          done();
        })
        .catch(done);
    });

    it('should reject the resource update with an invalid input', done => {
      fhirValidatorStub = fhirValidatorStub.returns(false);
      fhirService
        // @ts-ignore
        .updateResource(userId, badResource)
        .catch(err => {
          expect(err).to.not.be.null;
          expect(err.toString()).to.contain(
            'Called updateResource with an invalid fhirResource parameter.'
          );
          expect(fhirValidatorStub).to.be.calledOnce;
          expect(createRecordStub).to.not.be.called;
          done();
        })
        .catch(done);
      fhirValidatorStub.restore();
    });
  });

  describe('fetchResources', () => {
    it('should fetch Resources ', done => {
      fhirService
        .fetchResources(testVariables.userId)
        .then(result => {
          expect(result.records[0])
            .to.have.property('id')
            .equal(recordId);
          expect(searchRecordsStub).to.be.calledOnce;
          done();
        })
        .catch(done);
    });

    it('should add the exclude_tags parameter', done => {
      fhirService
        .fetchResources(testVariables.userId, {})
        .then(() => {
          expect(searchRecordsStub).to.be.calledWith(testVariables.userId, {
            exclude_tags: [testVariables.appDataFlag],
            tags: [],
          });
          done();
        })
        .catch(done);
    });

    it('should add the resourceType parameter as a tag', done => {
      const parameters = { resourceType: 'documentReference' };
      fhirService
        .fetchResources(testVariables.userId, parameters)
        .then(() => {
          expect(searchRecordsStub).to.be.calledWith(testVariables.userId, {
            tags: ['resourcetype=documentreference'],
            exclude_tags: [testVariables.appDataFlag],
          });
          done();
        })
        .catch(done);
    });

    it('should add the partner parameter as a tag', done => {
      const parameters = { partner: 'glumpany' };
      fhirService
        .fetchResources(testVariables.userId, parameters)
        .then(() => {
          expect(searchRecordsStub).to.be.calledWith(testVariables.userId, {
            tags: ['partner=glumpany'],
            exclude_tags: [testVariables.appDataFlag],
          });
          expect(parameters.partner).to.equal('glumpany');
          done();
        })
        .catch(done);
    });
  });

  describe('countResources', () => {
    it('should count Resources ', done => {
      fhirService
        .countResources(testVariables.userId)
        .then(result => {
          expect(result).to.equal(1);
          expect(searchRecordsStub).to.be.calledOnce;
          done();
        })
        .catch(done);
    });

    it('should add the resourceType parameter as a tag', done => {
      const parameters = { resourceType: 'documentReference' };
      fhirService
        .countResources(testVariables.userId, parameters)
        .then(() => {
          expect(searchRecordsStub).to.be.calledWith(
            testVariables.userId,
            {
              tags: ['resourcetype=documentreference'],
              exclude_tags: [testVariables.appDataFlag],
            },
            true
          );
          done();
        })
        .catch(done);
    });

    it('should add the partner parameter as a tag', done => {
      const parameters = { partner: 'glumpany' };
      fhirService
        .countResources(testVariables.userId, parameters)
        .then(() => {
          expect(searchRecordsStub).to.be.calledWith(
            testVariables.userId,
            { tags: ['partner=glumpany'], exclude_tags: [testVariables.appDataFlag] },
            true
          );
          expect(parameters.partner).to.equal('glumpany');
          done();
        })
        .catch(done);
    });
  });

  afterEach(() => {
    createRecordStub.restore();
    updateRecordStub.restore();
    downloadRecordStub.restore();
    searchRecordsStub.restore();
    fhirValidatorStub.restore();
  });
});
