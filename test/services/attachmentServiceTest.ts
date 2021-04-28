/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {
  attachBlobs,
  setAttachmentsToResource,
  getCleanAttachmentsFromResource,
  cleanResource,
} from '../../src/services/attachmentService';
import testVariables from '../testUtils/testVariables';
import stu3FhirResources from '../testUtils/stu3FhirResources';
import { D4LSDK } from '../../src/d4l';
import documentRoutes from '../../src/routes/documentRoutes';
import DocumentReference, { DOCUMENT_REFERENCE } from '../../src/lib/models/fhir/DocumentReference';

chai.use(sinonChai);

const { expect } = chai;

describe('cleanResource', () => {
  it('works on a mutable documentReference', () => {
    const resource = {
      resourceType: DOCUMENT_REFERENCE,
      content: [
        {
          attachment: {
            file: 'Pretend this is a file to be deleted',
            anotherProperty: 'I should survive this operation',
          },
        },
      ],
    };
    const cleanedResource = cleanResource(resource);
    // @ts-ignore
    expect(cleanedResource.content[0].attachment.file).to.be.undefined;
    // @ts-ignore
    expect(cleanedResource.content[0].attachment.anotherProperty).to.equal(
      'I should survive this operation'
    );
    expect(resource.content[0].attachment.file).not.to.be.undefined;
    expect(resource.content[0].attachment.anotherProperty).to.equal(
      'I should survive this operation'
    );
  });

  it('works on an immutable documentReference', () => {
    const resource = {
      resourceType: DOCUMENT_REFERENCE,
    };

    Object.defineProperty(resource, 'content', {
      value: [
        {
          attachment: {
            file: 'Pretend this is a file to be deleted',
            anotherProperty: 'I should survive this operation',
          },
        },
      ],
      configurable: false,
      writable: false,
    });
    const cleanedResource = cleanResource(resource);
    // @ts-ignore
    expect(cleanedResource.content[0].attachment.file).to.be.undefined;
    // @ts-ignore
    expect(cleanedResource.content[0].attachment.anotherProperty).to.equal(
      'I should survive this operation'
    );
    // @ts-ignore
    expect(resource.content[0].attachment.file).not.to.be.undefined;
    // @ts-ignore
    expect(resource.content[0].attachment.anotherProperty).to.equal(
      'I should survive this operation'
    );
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
          // @ts-ignore
          newAttachments: [newAttachment],
          // @ts-ignore
          resource: new D4LSDK.models.DocumentReference(stu3FhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        // @ts-ignore
        const uploadAttachments = resource.getAttachments();
        // @ts-ignore
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
          // @ts-ignore
          resource: new D4LSDK.models.DocumentReference(stu3FhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        // @ts-ignore
        const uploadAttachments = resource.getAttachments();
        // @ts-ignore
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledThrice;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        // @ts-ignore
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
          // @ts-ignore
          resource: new D4LSDK.models.DocumentReference(stu3FhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        // @ts-ignore
        const uploadAttachments = resource.getAttachments();
        // @ts-ignore
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledTwice;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        // @ts-ignore
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
          // @ts-ignore
          resource: new D4LSDK.models.DocumentReference(stu3FhirResources.documentReference),
        });
      })
      .then(([resource, returnResource]) => {
        // @ts-ignore
        const uploadAttachments = resource.getAttachments();
        // @ts-ignore
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledOnce;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        // @ts-ignore
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
        // @ts-ignore
        const resource = new D4LSDK.models.DocumentReference(stu3FhirResources.documentReference);
        resource.setAttachments([oldAttachment]);

        return attachBlobs({
          resource,
          encryptedFiles,
          ownerId: testVariables.userId,
          // @ts-ignore
          oldAttachments: [oldAttachment],
          // @ts-ignore
          newAttachments: [newAttachment],
        });
      })
      .then(([resource, returnResource]) => {
        // @ts-ignore
        const uploadAttachments = resource.getAttachments();
        // @ts-ignore
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub).to.be.calledOnce;
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments.length).to.equal(2);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        // @ts-ignore
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
        // @ts-ignore
        const resource = new D4LSDK.models.DocumentReference(stu3FhirResources.documentReference);
        resource.setAttachments([oldAttachment]);

        return attachBlobs({
          resource,
          encryptedFiles,
          ownerId: testVariables.userId,
          // @ts-ignore
          oldAttachments: [oldAttachment],
          // @ts-ignore
          newAttachments: [newAttachment1, newAttachment2],
        });
      })
      .then(([resource, returnResource]) => {
        // @ts-ignore
        const uploadAttachments = resource.getAttachments();
        // @ts-ignore
        const returnAttachments = returnResource.getAttachments();
        expect(uploadDocumentStub.callCount).to.equal(4);
        expect(uploadAttachments.length).to.equal(returnAttachments.length);
        expect(uploadAttachments.length).to.equal(3);
        expect(uploadAttachments[0].file).to.be.undefined;
        expect(returnAttachments[0].file).to.not.be.undefined;
        // @ts-ignore
        expect(returnResource.identifier).to.not.be.undefined;
        expect(returnAttachments[0].file instanceof Blob).to.be.true;
        expect(returnAttachments[1].file instanceof Blob).to.be.true;
        expect(returnAttachments[2].file instanceof Blob).to.be.true;
      })
      .then(done)
      .catch(done);
  });
});
