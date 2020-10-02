/* eslint-disable lodash/prefer-lodash-typecheck */
/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import * as jsCrypto from 'js-crypto';

import taggingUtils from '../../src/lib/taggingUtils';

import testVariables from '../testUtils/testVariables';
import userResources from '../testUtils/userResources';
import fhirResources from '../testUtils/fhirResources';
import recordResources from '../testUtils/recordResources';
import documentResources from '../testUtils/documentResources';
import encryptionResources from '../testUtils/encryptionResources';
import recordService from '../../src/services/recordService';

import * as documentRoutes from '../../src/routes/documentRoutes';
import * as userService from '../../src/services/userService';
import * as fhirValidator from '../../src/lib/fhirValidator';
import * as createCryptoService from '../../src/services/createCryptoService';

chai.use(sinonChai);

const { expect } = chai;

describe('services/recordService', () => {
  let jsCryptoStub = sinon.stub(jsCrypto);
  let documentRoutesStub = sinon.stub(documentRoutes);

  let createRecordStub = sinon
    .stub()
    .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));

  let createCryptoServiceStub;
  let encryptObjectStub;
  let updateKeysStub;
  let symEncryptStringStub;
  let symDecryptStringStub;
  let symEncryptObjectStub;
  let convertBase64ToArrayBufferViewStub;
  let convertArrayBufferViewToStringStub;

  let decryptDataStub;
  let deleteRecordStub;
  let downloadRecordStub;
  let fhirServiceUploadRecordSpy;

  let getUserStub;
  let searchRecordsStub;
  let getRecordsCountStub;
  let updateRecordStub;
  let fhirValidatorImportStub;
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
    userService.default.getUser = getUserStub;

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

    fhirValidatorImportStub = sinon.stub(fhirValidator);
    validateStub = sinon.stub().returns(Promise.resolve());
    fhirValidatorImportStub.default.validate = validateStub;

    fhirServiceUploadRecordSpy = sinon.spy(recordService, 'uploadRecord');

    createCryptoServiceStub = sinon.stub().returns({
      decryptData: decryptDataStub,
      encryptObject: encryptObjectStub,
      updateKeys: updateKeysStub,
    });
    // @ts-ignore
    createCryptoService.default = createCryptoServiceStub;

    documentRoutesStub.default.createRecord = createRecordStub;
    documentRoutesStub.default.downloadRecord = downloadRecordStub;
    documentRoutesStub.default.updateRecord = updateRecordStub;
    documentRoutesStub.default.searchRecords = searchRecordsStub;
    documentRoutesStub.default.deleteRecord = deleteRecordStub;

    /*
    console.log(jsCryptoStub.default.symEncryptString);
    jsCryptoStub.default.symEncryptString = symEncryptStringStub;
    jsCryptoStub.default.symEncryptObject = symEncryptObjectStub;
    jsCryptoStub.default.symDecryptString = symDecryptStringStub;
    jsCryptoStub.default.convertBase64ToArrayBufferView = convertBase64ToArrayBufferViewStub;
    jsCryptoStub.default.convertArrayBufferViewToString = convertArrayBufferViewToStringStub;*/

    // @ts-ignore
    global.__DATA_MODEL_VERSION__ = testVariables.dataModelVersion;
  });

  afterEach(() => {
    validateStub.reset();
    downloadRecordStub.reset();
    searchRecordsStub.reset();
    updateRecordStub.reset();
    getRecordsCountStub.reset();
    createRecordStub.reset();
    deleteRecordStub.reset();
    fhirServiceUploadRecordSpy.restore();

    taggingUtils.reset();
  });

  describe('createRecord', () => {
    it('should resolve when called with userId and correct fhirResource', done => {
      taggingUtils.setPartnerId(testVariables.partnerId);
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
        // @ts-ignore
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
  /*
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
      taggingUtils.setPartnerId(testVariables.partnerId);
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
        exclude_tags: [testVariables.appDataFlag],
        tags: [testVariables.tag, testVariables.secondTag],
      };

      const expectedParamsForRoute = {
        limit: 20,
        offset: 20,
        start_date: '2017-06-06',
        end_date: '2017-08-08',
        exclude_tags: [encryptionResources.encryptedString],
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
        exclude_tags: [],
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
  */

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
});
