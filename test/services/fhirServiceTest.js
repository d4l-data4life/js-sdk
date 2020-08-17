/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fhirService, {
  attachBlobs,
  prepareSearchParameters,
  setAttachmentsToResource,
  getCleanAttachmentsFromResource,
} from '../../src/services/fhirService';
import testVariables from '../testUtils/testVariables';
import fhirValidator from '../../src/lib/fhirValidator';
import fhirResources from '../testUtils/fhirResources';
import recordService from '../../src/services/recordService';
import { D4LSDK } from '../../src/d4l';
import documentRoutes from '../../src/routes/documentRoutes';

chai.use(sinonChai);

const { expect } = chai;

describe('prepareSearchParameters', () => {
  it('correctly prepares simple parameters', () => {
    const preparedParams = prepareSearchParameters({ limit: 4, offset: 3 });
    expect(preparedParams).to.deep.equal({
      limit: 4,
      offset: 3,
      tags: [],
    });
  });

  it('correctly prepares simple parameters with a tag', () => {
    const preparedParams = prepareSearchParameters({
      limit: 10,
      tags: ['superhero-origin-story'],
    });
    expect(preparedParams).to.deep.equal({
      limit: 10,
      tags: ['superhero-origin-story'],
    });
  });

  it('correctly prepares simple parameters with a tag and annotation', () => {
    const preparedParams = prepareSearchParameters({
      limit: 10,
      tags: ['superhero-origin-story'],
      annotations: ['an annoation'],
    });
    expect(preparedParams).to.deep.equal({
      limit: 10,
      tags: ['superhero-origin-story', 'custom=an%20annoation'],
    });
  });

  it('correctly prepares parameters with a tag and a resourceType', () => {
    const preparedParams = prepareSearchParameters({
      limit: 10,
      tags: ['superhero-origin-story'],
      resourceType: 'Patient',
    });
    expect(preparedParams).to.deep.equal({
      limit: 10,
      tags: ['superhero-origin-story', 'resourcetype=patient'],
    });
  });

  it('correctly prepares parameters with a tag and a partner', () => {
    const preparedParams = prepareSearchParameters({
      offset: 20,
      tags: ['superhero-origin-story'],
      partner: 'S.H.I.E.L.D.',
    });
    expect(preparedParams).to.deep.equal({
      offset: 20,
      tags: ['superhero-origin-story', 'partner=s%2eh%2ei%2ee%2el%2ed%2e'],
    });
  });

  it('throws when an unsupported parameter is passed', () => {
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
    const updatedDiagnosticReport = setAttachmentsToResource(diagnosticReport, attachments);
    expect(updatedDiagnosticReport).to.deep.equal({
      resourceType: 'DiagnosticReport',
      presentedForm: [{ image: 'simpleImage' }, { document: 'pdf' }],
    });
    expect(diagnosticReport).to.deep.equal(originalDiagnosticReport);
  });
});

describe('getAttachmentsFromResource', () => {
  it('should return the Attachments of a DocumentReference', () => {
    const documentReference = {
      resourceType: 'DocumentReference',
      content: [{ attachment: { image: 'simpleImage' } }, { attachment: { document: 'pdf' } }],
    };
    const attachments = getCleanAttachmentsFromResource(documentReference);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return an empty array when content is not set on DocumentReference', () => {
    const documentReference = {};
    const attachments = getCleanAttachmentsFromResource(documentReference);
    expect(documentReference).to.deep.equal({});
    expect(attachments).to.deep.equal([]);
  });

  it('should return the Attachments of a Patient', () => {
    const patient = {
      resourceType: 'Patient',
      photo: [{ image: 'simpleImage' }, { document: 'pdf' }],
    };
    const attachments = getCleanAttachmentsFromResource(patient);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return the Attachments of a Practitioner', () => {
    const practitioner = {
      resourceType: 'Practitioner',
      photo: [{ image: 'simpleImage' }, { document: 'pdf' }],
    };
    const attachments = getCleanAttachmentsFromResource(practitioner);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return the Attachments of a Medication', () => {
    const medication = {
      resourceType: 'Medication',
      image: [{ image: 'simpleImage' }, { document: 'pdf' }],
    };
    const attachments = getCleanAttachmentsFromResource(medication);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return the Attachments of a DiagnosticReport', () => {
    const diagnosticReport = {
      resourceType: 'DiagnosticReport',
      presentedForm: [{ image: 'simpleImage' }, { document: 'pdf' }],
    };
    const attachments = getCleanAttachmentsFromResource(diagnosticReport);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return the Attachments of an Observation with a component and a valueAttachment', () => {
    const practitioner = {
      resourceType: 'Observation',
      valueAttachment: { image: 'simpleImage' },
      component: [{ valueAttachment: { document: 'pdf' } }],
    };
    const attachments = getCleanAttachmentsFromResource(practitioner);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return the Attachments of an Observation with only a component attachment', () => {
    const practitioner = {
      resourceType: 'Observation',
      component: [
        { valueAttachment: { image: 'simpleImage' } },
        { valueString: 'i am string' },
        { valueAttachment: { document: 'pdf' } },
      ],
    };
    const attachments = getCleanAttachmentsFromResource(practitioner);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }, { document: 'pdf' }]);
  });

  it('should return the Attachments of an Observation with only a valueAttachment', () => {
    const practitioner = {
      resourceType: 'Observation',
      valueAttachment: { image: 'simpleImage' },
    };
    const attachments = getCleanAttachmentsFromResource(practitioner);
    expect(attachments).to.deep.equal([{ image: 'simpleImage' }]);
  });

  it('should return no attachments of an Observation with no valueAttachment and no component-based attachments', () => {
    const practitioner = {
      resourceType: 'Observation',
    };
    const attachments = getCleanAttachmentsFromResource(practitioner);
    expect(attachments).to.deep.equal([]);
  });

  it('should return the Attachments of a Questionnaire', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      item: [{ initialAttachment: { document: 'pdf' } }],
    };
    const attachments = getCleanAttachmentsFromResource(questionnaire);
    expect(attachments).to.deep.equal([{ document: 'pdf' }]);
  });

  it('should not return the non-existent attachments of a Questionnaire', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      item: [{ initialString: 'i am a string' }],
    };
    const attachments = getCleanAttachmentsFromResource(questionnaire);
    expect(attachments).to.deep.equal([]);
  });

  it('should return the Attachments of a QuestionnaireResponse', () => {
    const questionnaire = {
      resourceType: 'QuestionnaireResponse',
      item: [
        {
          answer: [
            { valueAttachment: { document: 'pdf' } },
            { valueString: 'still just a string' },
          ],
        },
        {
          answer: [{ valueAttachment: { image: 'simpleImage' } }],
        },
      ],
    };
    const attachments = getCleanAttachmentsFromResource(questionnaire);
    expect(attachments).to.deep.equal([{ document: 'pdf' }, { image: 'simpleImage' }]);
  });

  it('should return an empty array for QuestionnaireResponse with no valueAttachments', () => {
    const questionnaire = {
      resourceType: 'QuestionnaireResponse',
      item: [
        {
          answer: [{ valueString: 'still just a string' }],
        },
      ],
    };
    const attachments = getCleanAttachmentsFromResource(questionnaire);
    expect(attachments).to.deep.equal([]);
  });
});

describe('attachBlobs', () => {
  let uploadDocumentStub;
  const mockPdfBlob = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const mockPngBlob = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

  beforeEach(() => {
    uploadDocumentStub = sinon
      .stub(documentRoutes, 'uploadDocument')
      .returns(Promise.resolve({ document_id: 'document_id' }));
  });

  afterEach(() => {
    uploadDocumentStub.restore();
  });

  it('correctly attaches a single non-image', done => {
    fetch('/fileSamples/sample.pdf')
      .then(res => res.blob())
      .then(resAsFile => {
        const newAttachment = {
          file: resAsFile, // not that the actual image matters, all based on props
          title: 'not a doctor',
        };

        // technically not encrypted at this point
        const encryptedFiles = [mockPdfBlob];
        return attachBlobs({
          encryptedFiles,
          ownerId: testVariables.userId,
          oldAttachments: [],
          newAttachments: [newAttachment],
          resource: new D4LSDK.models.DocumentReference(fhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        const uploadAttachments = resource.getAttachments();
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledOnce;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
  });

  it('correctly attaches a single image with preview and thumbnail', done => {
    fetch('/fileSamples/sample.png')
      .then(res => res.blob())
      .then(resAsFile => {
        const newAttachment = {
          file: resAsFile, // not that the actual image matters, all based on props
          title: 'not a doctor',
          isImage: true,
          hasPreview: true,
          hasThumb: true,
        };

        // technically not encrypted at this point
        const encryptedFiles = [mockPngBlob, mockPngBlob, mockPngBlob];
        return attachBlobs({
          encryptedFiles,
          ownerId: testVariables.userId,
          oldAttachments: [],
          newAttachments: [newAttachment],
          resource: new D4LSDK.models.DocumentReference(fhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        const uploadAttachments = resource.getAttachments();
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledThrice;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        expect(returnResource.identifier).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
  });

  it('correctly attaches a single image with just a thumbnail', done => {
    let attachment;
    fetch('/fileSamples/sample.png')
      .then(res => res.blob())
      .then(resAsFile => {
        attachment = {
          file: resAsFile, // not that the actual image matters, all based on props
          title: 'not a doctor',
          isImage: true,
          hasThumb: true,
        };

        // technically not encrypted at this point
        const encryptedFiles = [mockPngBlob, mockPngBlob];
        return attachBlobs({
          encryptedFiles,
          ownerId: testVariables.userId,
          oldAttachments: [],
          newAttachments: [attachment],
          resource: new D4LSDK.models.DocumentReference(fhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        const uploadAttachments = resource.getAttachments();
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledTwice;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        expect(returnResource.identifier).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
  });

  it('correctly attaches a single image with no thumbnail or preview', done => {
    let attachment;
    fetch('/fileSamples/sample.png')
      .then(res => res.blob())
      .then(resAsFile => {
        attachment = {
          file: resAsFile, // not that the actual image matters, all based on props
          title: 'not a doctor',
          isImage: true,
        };

        // technically not encrypted at this point
        const encryptedFiles = [mockPngBlob];
        return attachBlobs({
          encryptedFiles,
          ownerId: testVariables.userId,
          oldAttachments: [],
          newAttachments: [attachment],
          resource: new D4LSDK.models.DocumentReference(fhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        const uploadAttachments = resource.getAttachments();
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledOnce;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        expect(returnResource.identifier).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
  });

  it('adds a second attachment but keeps the old one intact', done => {
    fetch('/fileSamples/sample.pdf')
      .then(res => res.blob())
      .then(resAsFile => {
        const newAttachment = {
          file: resAsFile, // not that the actual image matters, all based on props
          title: 'not a doctor',
        };
        const oldAttachment = {
          file: resAsFile, // not that the actual image matters, all based on props
          title: 'old attachment',
        };

        // technically not encrypted at this point
        const encryptedFiles = [mockPdfBlob];
        const resource = new D4LSDK.models.DocumentReference(fhirResources.documentReference);
        resource.setAttachments([oldAttachment]);

        return attachBlobs({
          resource,
          encryptedFiles,
          ownerId: testVariables.userId,
          oldAttachments: [oldAttachment],
          newAttachments: [newAttachment],
        });
      })
      .then(([resource, returnResource]) => {
        const uploadAttachments = resource.getAttachments();
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledOnce;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments.length).to.equal(2);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        expect(returnResource.identifier).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
        expect(returnAttachments[1].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
  });

  it('works as expected with a document with one existing attachment and new ones', done => {
    fetch('/fileSamples/sample.pdf')
      .then(res => res.blob())
      .then(resAsFile => {
        const newAttachment1 = {
          file: resAsFile,
          title: 'not a doctor',
          isImage: true,
          hasPreview: true,
          hasThumb: true,
        };
        const newAttachment2 = {
          file: resAsFile,
          title: 'fermulon',
        };
        const oldAttachment = {
          file: resAsFile,
          title: 'old attachment',
        };

        // technically not encrypted at this point
        const encryptedFiles = [mockPngBlob, mockPngBlob, mockPngBlob, mockPdfBlob];
        const resource = new D4LSDK.models.DocumentReference(fhirResources.documentReference);
        resource.setAttachments([oldAttachment]);

        return attachBlobs({
          resource,
          encryptedFiles,
          ownerId: testVariables.userId,
          oldAttachments: [oldAttachment],
          newAttachments: [newAttachment1, newAttachment2],
        });
      })
      .then(([resource, returnResource]) => {
        const uploadAttachments = resource.getAttachments();
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub.callCount).to.equal(4);
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments.length).to.equal(3);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        expect(returnResource.identifier).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
        expect(returnAttachments[1].file instanceof Blob).to.be.true;
        expect(returnAttachments[2].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
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
    customCreationDate: '2017-09-19',
    user_id: userId,
    fhirResource: fhirResources.carePlan,
    tags: ['tag1', 'tag2', testVariables.secondTag],
    version: 1,
    status: 'Active',
    updatedDate: '2017-09-19T09:29:48.278',
  };

  const record = {
    id: recordId,
    customCreationDate: '2017-09-19',
    fhirResource: fhirResources.carePlan,
    updatedDate: '2017-09-19T09:29:48.278',
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
    fhirValidatorStub = sinon.stub(fhirValidator, 'validate').returns(Promise.resolve());

    searchRecordsStub = sinon.stub(recordService, 'searchRecords').returns(
      Promise.resolve({
        totalCount: 1,
        records: [decryptedRecord],
      })
    );
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
    it('should create resource with a valid input', done => {
      const d4lResource = { resourceType: 'CarePlan', id: 'record_id' };
      fhirService
        .createResource(userId, d4lResource)
        .then(res => {
          expect(createRecordStub).to.be.calledWith(userId);
          const { args } = createRecordStub.getCall(0);
          expect(args[1].tags.toString()).to.contain('fhirversion=3%2e0%2e1');
          expect(createRecordStub).to.be.calledOnce;
          expect(res).to.deep.equal(record);
          done();
        })
        .catch(done);
    });

    it('should reject the resource creation with an invalid input', done => {
      fhirValidatorStub.returns(false);
      fhirService
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
    it('should update a resource correctly', done => {
      const d4lResource = Object.assign(
        {
          id: testVariables.recordId,
        },
        fhirResources.carePlan
      );
      const customCreationDate = new Date();
      fhirService
        .updateResource(userId, d4lResource, customCreationDate)
        .then(res => {
          expect(updateRecordStub).to.be.calledOnce;
          expect(updateRecordStub).to.be.calledWith(userId, {
            id: d4lResource.id,
            fhirResource: d4lResource,
            tags: [],
            attachmentKey: undefined,
            customCreationDate,
          });
          expect(res).to.deep.equal(record);
          done();
        })
        .catch(done);
    });

    it('should reject a resource without an id', done => {
      const d4lResource = Object.assign({}, fhirResources.carePlan);
      delete d4lResource.id;
      fhirService
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
            exclude_tags: ['flag=appdata'],
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
            exclude_tags: ['flag=appdata'],
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
            exclude_tags: ['flag=appdata'],
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
            { tags: ['resourcetype=documentreference'], exclude_tags: ['flag=appdata'] },
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
            { tags: ['partner=glumpany'], exclude_tags: ['flag=appdata'] },
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
