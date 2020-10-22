/* eslint-disable lodash/prefer-lodash-typecheck */
/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { convertObjectToArrayBufferView } from 'js-crypto';

import taggingUtils from '../../src/lib/taggingUtils';
import documentRoutes from '../../src/routes/documentRoutes';
import userService from '../../src/services/userService';
import * as fhirValidator from '../../src/lib/fhirValidator';
import * as createCryptoService from '../../src/services/createCryptoService';

import testVariables from '../testUtils/testVariables';
import documentResources from '../testUtils/documentResources';
import userResources from '../testUtils/userResources';
import stu3FhirResources from '../testUtils/stu3FhirResources';
import recordResources from '../testUtils/recordResources';
import encryptionResources from '../testUtils/encryptionResources';
import recordService from '../../src/services/recordService';

chai.use(sinonChai);
const { expect } = chai;

describe('services/recordService', () => {
  let createRecordStub;
  let createCryptoServiceStub;
  let encryptObjectStub;
  let updateKeysStub;

  let decryptDataStub;
  let deleteRecordStub;
  let downloadRecordStub;
  let recordServiceUploadRecordSpy;

  let getUserStub;
  let searchRecordsStub;
  let getRecordsCountStub;
  let updateRecordStub;
  let validateStub;

  beforeEach(() => {
    // USERSERVICE
    getUserStub = sinon
      .stub(userService, 'getUser')
      .returns(Promise.resolve(userResources.cryptoUser));

    // DOCUMENTROUTES
    createRecordStub = sinon
      .stub(documentRoutes, 'createRecord')
      .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));
    deleteRecordStub = sinon.stub(documentRoutes, 'deleteRecord').returns(Promise.resolve());
    downloadRecordStub = sinon
      .stub(documentRoutes, 'downloadRecord')
      .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));
    getRecordsCountStub = sinon.stub(documentRoutes, 'getRecordsCount').returns(
      Promise.resolve({
        totalCount: recordResources.count,
      })
    );
    searchRecordsStub = sinon.stub(documentRoutes, 'searchRecords').returns(
      Promise.resolve({
        totalCount: recordResources.count,
        records: [
          Object.assign({}, recordResources.documentReferenceEncrypted, {
            tags: [],
          }),
        ],
      })
    );
    updateRecordStub = sinon
      .stub(documentRoutes, 'updateRecord')
      .returns(Promise.resolve(Object.assign({}, recordResources.documentReferenceEncrypted)));

    // FHIRVALIDATOR
    validateStub = sinon.stub().returns(Promise.resolve());
    fhirValidator.default.validate = validateStub;

    // CREATECRYPTOSERVICE
    decryptDataStub = sinon
      .stub()
      .returns(
        Promise.resolve(convertObjectToArrayBufferView(stu3FhirResources.documentReference))
      );
    encryptObjectStub = sinon.stub().returns(
      Promise.resolve([
        encryptionResources.encryptedObject,
        {
          commonKeyId: testVariables.commonKeyId,
          encryptedKey: encryptionResources.encryptedDataKey,
        },
      ])
    );
    updateKeysStub = sinon
      .stub()
      .returns(
        Promise.resolve([{ commonKeyId: testVariables.commonKeyId, encryptedKey: 'encrypted_key' }])
      );
    // @ts-ignore
    createCryptoServiceStub = sinon.stub(createCryptoService, 'default').returns({
      decryptData: decryptDataStub,
      encryptObject: encryptObjectStub,
      updateKeys: updateKeysStub,
    });

    recordServiceUploadRecordSpy = sinon.spy(recordService, 'uploadRecord');

    taggingUtils.setPartnerId(testVariables.partnerId);
    // @ts-ignore
    global.__DATA_MODEL_VERSION__ = testVariables.dataModelVersion;
  });

  afterEach(() => {
    // USERSERVICE
    getUserStub.restore();
    // DOCUMENTROUTES
    createRecordStub.restore();
    deleteRecordStub.restore();
    downloadRecordStub.restore();
    getRecordsCountStub.restore();
    searchRecordsStub.restore();
    updateRecordStub.restore();
    // CREATECRYPTOSERVICE
    updateKeysStub.reset();
    createCryptoServiceStub.restore();
    // FHIRVALIDATOR
    validateStub.reset();

    taggingUtils.reset();

    recordServiceUploadRecordSpy.restore();
  });

  describe('createRecord', () => {
    it('should resolve when called with userId and correct fhirResource', done => {
      const tags = [
        taggingUtils.generateCreationTag(),
        ...taggingUtils.generateTagsFromFhir(stu3FhirResources.documentReference),
      ];

      recordService
        .createRecord(testVariables.userId, {
          fhirResource: stu3FhirResources.documentReference,
        })
        .then(() => {
          expect(createRecordStub).to.be.calledOnce;
          expect(createRecordStub.getCall(0).args[1].model_version).to.equal(
            testVariables.dataModelVersion
          );
          expect(createRecordStub).to.be.calledWith(testVariables.userId);
          expect(validateStub).to.be.calledOnce;
          expect(validateStub).to.be.calledWith(stu3FhirResources.documentReference);
          expect(getUserStub).to.be.calledOnce;
          expect(getUserStub).to.be.calledWith(testVariables.userId);
          expect(recordServiceUploadRecordSpy).to.be.calledWith(testVariables.userId, {
            fhirResource: stu3FhirResources.documentReference,
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
          fhirResource: stu3FhirResources.documentReference,
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
          fhirResource: stu3FhirResources.documentReference,
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
          fhirResource: stu3FhirResources.documentReference,
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
        ...taggingUtils.generateTagsFromFhir(stu3FhirResources.documentReference),
      ];

      recordService
        .updateRecord(testVariables.userId, {
          id: testVariables.recordId,
          fhirResource: stu3FhirResources.documentReference,
          tags: taggingUtils.generateCustomTags(documentResources.annotations),
        })
        .then(res => {
          expect(res.id).to.deep.equal(testVariables.recordId);
          expect(updateRecordStub).to.be.calledOnce;
          expect(recordServiceUploadRecordSpy.args[0][0]).to.equal(testVariables.userId);
          expect(Object.keys(recordServiceUploadRecordSpy.args[0][1])).have.members([
            'id',
            'fhirResource',
            'tags',
          ]);
          expect(recordServiceUploadRecordSpy).to.be.calledWith(testVariables.userId, {
            id: testVariables.recordId,
            fhirResource: stu3FhirResources.documentReference,
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
          expect(res.fhirResource).to.deep.equal(stu3FhirResources.documentReference);
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
        exclude_tags: [testVariables.encryptedAppDataFlag],
        tags: [testVariables.encryptedTag, testVariables.encryptedSecondTag],
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
        tags: [testVariables.tag],
      };

      const expectedParamsForRoute = {
        exclude_tags: [],
        tags: [testVariables.encryptedTag],
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
});
