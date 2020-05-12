/* eslint-disable lodash/prefer-lodash-typecheck */
/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import proxy from 'proxyquireify';
import 'hc-crypto';

import '../../src/routes/documentRoutes';
import '../../src/services/recordService';
import '../../src/services/userService';
import '../../src/lib/fhirValidator';
import taggingUtils from '../../src/lib/taggingUtils';

import testVariables from '../testUtils/testVariables';
import userResources from '../testUtils/userResources';
import fhirResources from '../testUtils/fhirResources';
import recordResources from '../testUtils/recordResources';
import documentResources from '../testUtils/documentResources';
import encryptionResources from '../testUtils/encryptionResources';

const proxyquire = proxy(require);
chai.use(sinonChai);

const { expect } = chai;

describe('services/recordService', () => {
  let recordService;
  let createCryptoServiceStub;

  let encryptObjectStub;
  let updateKeysStub;
  let symEncryptStringStub;
  let symDecryptStringStub;
  let symEncryptObjectStub;
  let convertBase64ToArrayBufferViewStub;
  let convertArrayBufferViewToStringStub;

  let createRecordStub;
  let decryptDataStub;
  let deleteRecordStub;
  let downloadRecordStub;
  let fhirServiceUploadRecordSpy;

  let getUserStub;
  let searchRecordsStub;
  let getRecordsCountStub;
  let updateRecordStub;
  let validateStub;

  beforeEach(() => {
    encryptObjectStub = sinon.stub().returns(
      Promise.resolve([
        encryptionResources.encryptedObject,
        {
          commonKeyId: testVariables.commonKeyId,
          encryptedKey: encryptionResources.encryptedDataKey,
        },
      ])
    );

    decryptDataStub = sinon.stub().returns(Promise.resolve(encryptionResources.data));
    symEncryptStringStub = sinon
      .stub()
      .returns(Promise.resolve(encryptionResources.encryptedString));
    symDecryptStringStub = sinon.stub().returns(Promise.resolve(encryptionResources.string));
    symEncryptObjectStub = sinon.stub().returns(Promise.resolve(encryptionResources.string));
    convertBase64ToArrayBufferViewStub = sinon.stub().returns(encryptionResources.data);
    convertArrayBufferViewToStringStub = sinon
      .stub()
      .returns(JSON.stringify(fhirResources.documentReference));

    getUserStub = sinon.stub().returns(Promise.resolve(userResources.cryptoUser));

    createRecordStub = sinon
      .stub()
      .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));
    deleteRecordStub = sinon.stub().returns(Promise.resolve());
    updateKeysStub = sinon
      .stub()
      .returns(
        Promise.resolve([{ commonKeyId: testVariables.commonKeyId, encryptedKey: 'encrypted_key' }])
      );
    downloadRecordStub = sinon
      .stub()
      .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));
    getRecordsCountStub = sinon.stub().returns(
      Promise.resolve({
        totalCount: recordResources.count,
      })
    );
    searchRecordsStub = sinon.stub().returns(
      Promise.resolve({
        totalCount: recordResources.count,
        records: [Object.assign({}, recordResources.documentReferenceEncrypted)],
      })
    );
    updateRecordStub = sinon
      .stub()
      .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));

    validateStub = sinon.stub().returns(Promise.resolve());

    createCryptoServiceStub = sinon.stub().returns({
      decryptData: decryptDataStub,
      encryptObject: encryptObjectStub,
      updateKeys: updateKeysStub,
    });
    recordService = proxyquire('../../src/services/recordService', {
      './createCryptoService': {
        default: createCryptoServiceStub,
      },
      './userService': {
        default: {
          getUser: getUserStub,
        },
      },
      '../routes/documentRoutes': {
        default: {
          updateRecord: updateRecordStub,
          searchRecords: searchRecordsStub,
          getRecordsCount: getRecordsCountStub,
          createRecord: createRecordStub,
          deleteRecord: deleteRecordStub,
          downloadRecord: downloadRecordStub,
        },
      },
      '../lib/fhirValidator': {
        default: { validate: validateStub },
      },
      'hc-crypto': {
        symEncryptString: symEncryptStringStub,
        symEncryptObject: symEncryptObjectStub,
        symDecryptString: symDecryptStringStub,
        convertBase64ToArrayBufferView: convertBase64ToArrayBufferViewStub,
        convertArrayBufferViewToString: convertArrayBufferViewToStringStub,
      },
      '../lib/taggingUtils': {
        default: {
          clientId: testVariables.clientId,
          ...taggingUtils,
        },
      },
    }).default;

    fhirServiceUploadRecordSpy = sinon.spy(recordService, 'uploadRecord');
    global.__DATA_MODEL_VERSION__ = testVariables.dataModelVersion;
  });

  describe('createRecord', () => {
    it('should resolve when called with userId and correct fhirResource', done => {
      const tags = [
        taggingUtils.generateCreationTag(),
        ...taggingUtils.generateTagsFromFhir(fhirResources.documentReference),
      ];
      recordService
        .createRecord(testVariables.userId, {
          fhirResource: fhirResources.documentReference,
        })
        .then(() => {
          expect(createRecordStub).to.be.calledOnce;
          expect(createRecordStub.getCall(0).args[1].model_version).to.equal(
            testVariables.dataModelVersion
          );
          expect(createRecordStub).to.be.calledWith(testVariables.userId);
          expect(validateStub).to.be.calledOnce;
          expect(validateStub).to.be.calledWith(fhirResources.documentReference);
          expect(getUserStub).to.be.calledOnce;
          expect(getUserStub).to.be.calledWith(testVariables.userId);
          expect(fhirServiceUploadRecordSpy).to.be.calledWith(testVariables.userId, {
            fhirResource: fhirResources.documentReference,
            tags,
          });
          done();
        })
        .catch(done);
    });

    it('fails when fhirValidation fails', done => {
      validateStub.returns(Promise.reject());

      recordService
        .uploadFhirRecord(testVariables.userId, {
          fhirResource: fhirResources.documentReference,
        })
        .then(() => done(Error("fhirValidation didn't fail as expected")))
        .catch(() => {
          expect(validateStub).to.be.calledOnce;
          expect(createRecordStub).to.not.be.called;
          done();
        })
        .catch(done);
    });
  });

  describe('updateRecord', () => {
    it('should resolve when called with userId, recordId and fhirResource ', done => {
      recordService
        .updateRecord(testVariables.userId, {
          id: testVariables.recordId,
          fhirResource: fhirResources.documentReference,
        })
        .then(res => {
          expect(res.id).to.deep.equal(testVariables.recordId);
          expect(updateRecordStub).to.be.calledOnce;
          expect(getUserStub).to.be.calledTwice;
          expect(getUserStub).to.be.calledWith(testVariables.userId);
          expect(updateKeysStub).to.be.calledOnce;
          expect(updateKeysStub).to.be.calledWith({
            commonKeyId: testVariables.commonKeyId,
            encryptedKey: encryptionResources.encryptedDataKey,
          });
          done();
        })
        .catch(done);
    });

    it('should update the attachment key if one is provided', done => {
      const customCkId = 'custom_common_key_id';
      const dataKey = { commonKeyId: testVariables.commonKeyId, encryptedKey: 'updated data key' };
      const attachmentKey = {
        commonKeyId: testVariables.commonKeyId,
        encryptedKey: 'updated attachment key',
      };
      updateKeysStub.returns([dataKey, attachmentKey]);
      recordService
        .updateRecord(testVariables.userId, {
          id: testVariables.recordId,
          fhirResource: fhirResources.documentReference,
          attachmentKey: {
            commonKeyId: customCkId,
            encryptedKey: encryptionResources.encryptedAttachmentKey,
          },
        })
        .then(() => {
          expect(updateKeysStub).to.be.calledOnce;
          expect(updateKeysStub).to.be.calledWith(
            {
              commonKeyId: testVariables.commonKeyId,
              encryptedKey: encryptionResources.encryptedDataKey,
            },
            {
              commonKeyId: customCkId,
              encryptedKey: encryptionResources.encryptedAttachmentKey,
            }
          );

          const [, , recordToUpload] = updateRecordStub.getCall(0).args;
          expect(recordToUpload.encrypted_key).to.equal(dataKey.encryptedKey);
          expect(recordToUpload.attachment_key).to.equal(attachmentKey.encryptedKey);
          done();
        })
        .catch(done);
    });

    it('should pass the right custom tags corresponding to the annotations passed', done => {
      const tags = [
        ...taggingUtils.generateCustomTags(documentResources.annotations),
        taggingUtils.generateUpdateTag(),
        ...[encryptionResources.string],
        ...taggingUtils.generateTagsFromFhir(fhirResources.documentReference),
      ];

      recordService
        .updateRecord(testVariables.userId, {
          id: testVariables.recordId,
          fhirResource: fhirResources.documentReference,
          tags: taggingUtils.generateCustomTags(documentResources.annotations),
        })
        .then(res => {
          expect(res.id).to.deep.equal(testVariables.recordId);
          expect(updateRecordStub).to.be.calledOnce;
          expect(fhirServiceUploadRecordSpy).to.be.calledWith(testVariables.userId, {
            id: testVariables.recordId,
            fhirResource: fhirResources.documentReference,
            tags,
          });
          done();
        })
        .catch(done);
    });
  });

  describe('downloadRecord', () => {
    it('should resolve to Record, when called with userId and recordId', done => {
      recordService
        .downloadRecord(testVariables.userId, testVariables.recordId)
        .then(res => {
          expect(res.fhirResource).to.deep.equal(fhirResources.documentReference);
          expect(downloadRecordStub).to.be.calledOnce;
          expect(downloadRecordStub).to.be.calledWith(testVariables.userId);
          expect(getUserStub).to.be.calledOnce;
          expect(createCryptoServiceStub).to.be.calledOnce;
          expect(createCryptoServiceStub).to.be.calledWith(testVariables.userId);
          done();
        })
        .catch(done);
    });
  });

  describe('searchRecords', () => {
    it('works as expected with all parameters', done => {
      const params = {
        limit: 20,
        offset: 20,
        start_date: '2017-06-06',
        end_date: '2017-08-08',
        tags: [testVariables.tag, testVariables.secondTag],
      };

      const expectedParamsForRoute = {
        limit: 20,
        offset: 20,
        start_date: '2017-06-06',
        end_date: '2017-08-08',
        tags: [encryptionResources.encryptedString, encryptionResources.encryptedString],
      };

      recordService
        .searchRecords(testVariables.userId, params)
        .then(res => {
          expect(res.records.length).to.equal(1);
          expect(res.records[0].updatedDate instanceof Date).to.equal(true);
          expect(res.records[0].customCreationDate instanceof Date).to.equal(true);
          expect(res.totalCount).to.equal(recordResources.count);
          expect(res.records[0].id).to.equal(testVariables.recordId);
          expect(searchRecordsStub).to.be.calledOnce;
          expect(searchRecordsStub).to.be.calledWith(testVariables.userId, expectedParamsForRoute);
          expect(getUserStub).to.be.calledOnce;
          done();
        })
        .catch(done);
    });

    it('ignores corrupted records and resolves', done => {
      // eslint-disable-next-line prefer-promise-reject-errors
      decryptDataStub.withArgs().returns(Promise.reject('Error'));

      recordService
        .searchRecords(testVariables.userId, {})
        .then(res => {
          expect(res.records.length).to.equal(0);
          done();
        })
        .catch(done);
    });

    it('returns only count when one of params is countOnly', done => {
      const params = {
        tags: [testVariables.partnerId],
      };

      const expectedParamsForRoute = {
        tags: [encryptionResources.encryptedString],
      };

      recordService
        .searchRecords(testVariables.userId, params, true)
        .then(res => {
          expect(res.totalCount).to.equal(recordResources.count);
          expect(getRecordsCountStub).to.be.calledOnce;
          expect(getRecordsCountStub).to.be.calledWith(
            testVariables.userId,
            expectedParamsForRoute
          );
          expect(getUserStub).to.be.calledOnce;
          done();
        })
        .catch(done);
    });
  });

  describe('deleteRecord', () => {
    it('should resolve, when called with userId and recordId', done => {
      recordService
        .deleteRecord(testVariables.userId, testVariables.recordId)
        .then(() => {
          expect(deleteRecordStub).to.be.calledOnce;
          expect(deleteRecordStub).to.be.calledWith(testVariables.userId, testVariables.recordId);
          done();
        })
        .catch(done);
    });
  });

  afterEach(() => {
    validateStub.reset();
    downloadRecordStub.reset();
    searchRecordsStub.reset();
    updateRecordStub.reset();
    getRecordsCountStub.reset();
    createRecordStub.reset();
    deleteRecordStub.reset();
  });
});
