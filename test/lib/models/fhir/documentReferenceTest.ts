/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import DocumentReference from '../../../../src/lib/models/fhir/DocumentReference';

import Attachment from '../../../../src/lib/models/fhir/Attachment';
import Practitioner from '../../../../src/lib/models/fhir/Practitioner';
import { createCodeableConcept } from '../../../../src/lib/models/fhir/helper';
import stu3FhirResources from '../../../testUtils/stu3FhirResources';

chai.use(sinonChai);

const { expect } = chai;

describe('models/FHIR', () => {
  describe('DocumentReference', () => {
    it('should be possible to create a document object with constructor parameters', () => {
      const attachment = new Attachment({
        id: 'attachmentId',
        contentType: 'image/png',
        creation: new Date(),
        title: 'John Doe',
      });
      const type = createCodeableConcept(
        'Radiology Study observation (findings)',
        '18782-3',
        'http://loinc.org'
      );
      const practitioner = new Practitioner({
        firstName: 'Shawn',
        lastName: 'Murphy',
        prefix: 'Dr.',
        suffix: 'Jr.',
        street: 'Liverpool str.',
        city: 'London',
        postalCode: '20439',
        telephone: '915023421456',
        website: 'www.example.com',
      });
      const practiceSpecialty = createCodeableConcept('Urology', '12321321', 'http://loinc.com');
      const documentReference = new DocumentReference({
        attachments: [attachment],
        type,
        title: 'John Doe Document',
        // @ts-ignore
        customCreationDate: new Date('2018-08-08'),
        author: practitioner,
        practiceSpecialty,
        id: 'documentId',
      });
      expect(documentReference.getTitle()).to.equal('John Doe Document');
      expect(documentReference.getType()).to.equal(type);
      expect(documentReference.getPracticeSpecialty()).to.equal(practiceSpecialty);
      // eslint-disable-next-line max-len
      expect(JSON.stringify(documentReference.getAuthor())).to.equal(JSON.stringify(practitioner));
      expect(documentReference.getPractitioner().getFirstName()).to.equal('Shawn');
      expect(documentReference.getAttachments()[0]).to.equal(attachment);
    });
    it('should be possible to create a document object with limited constructor parameters', () => {
      const attachment = new Attachment({
        id: 'attachmentId',
        contentType: 'image/png',
        creation: new Date(),
        title: 'John Doe',
      });
      const documentReference = new DocumentReference({
        attachments: [attachment],
        title: 'John Doe Document',
      });
      expect(documentReference.getTitle()).to.equal('John Doe Document');
      expect(JSON.stringify(documentReference.getType())).to.equal(JSON.stringify({}));
      expect(documentReference.getPracticeSpecialty()).to.equal(undefined);
      expect(documentReference.getAuthor()).to.equal(undefined);
      expect(documentReference.getPractitioner()).to.equal(undefined);
      expect(documentReference.getAttachments()[0]).to.equal(attachment);
    });
    it('should be possible to set additional ids to document', () => {
      const attachment = new Attachment({
        id: 'attachmentId',
        contentType: 'image/png',
        creation: new Date(),
        title: 'John Doe',
      });
      const documentReference = new DocumentReference({
        attachments: [attachment],
      });
      documentReference.setAdditionalIdForClient('clientId', 'customId');
      expect(documentReference.getAdditionalIdForClient('clientId')).to.equal('customId');
    });
    it('should be possible to override additional id for client', () => {
      const attachment = new Attachment({
        id: 'attachmentId',
        contentType: 'image/png',
        creation: new Date(),
        title: 'John Doe',
      });
      const documentReference = new DocumentReference({
        attachments: [attachment],
      });
      documentReference.setAdditionalIdForClient('clientId', 'customId1');
      documentReference.setAdditionalIdForClient('clientId', 'customId2');
      expect(documentReference.getAdditionalIdForClient('clientId')).to.equal('customId2');
    });
    it('should return undefined additional id for unknown client', () => {
      const attachment = new Attachment({
        id: 'attachmentId',
        contentType: 'image/png',
        creation: new Date(),
        title: 'John Doe',
      });
      const documentReference = new DocumentReference({
        attachments: [attachment],
      });

      expect(documentReference.getAdditionalIdForClient('clientId')).to.equal(undefined);
    });

    it('should return valid Document instance with fromFHIRObject', () => {
      const documentReference = DocumentReference.fromFHIRObject(
        stu3FhirResources.documentReference
      );
      expect(documentReference.getType().text).to.equal('Document');
    });

    it('should return undefined for an unset author, practitioner, specialty when not in original resource', () => {
      const convertedDocument = DocumentReference.fromFHIRObject(
        // @ts-ignore
        stu3FhirResources.authorlessDocumentReference
      );
      /* eslint-disable no-unused-expressions */
      expect(convertedDocument.getAuthor()).to.be.undefined;
      expect(convertedDocument.getPractitioner()).to.be.undefined;
      expect(convertedDocument.getPracticeSpecialty()).to.be.undefined;
      /* eslint-enable no-unused-expressions */
    });

    it('should throw error when fromFHIRObject is called with no arguments', done => {
      try {
        // @ts-ignore
        DocumentReference.fromFHIRObject();
      } catch (err) {
        expect(err.message).to.equal(
          'DocumentReference.fromFHIRObject requires 1 argument of type fhir DocumentReference.'
        );
        done();
      }
    });
  });
});
