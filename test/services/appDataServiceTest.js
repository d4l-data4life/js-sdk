/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import testVariables from '../testUtils/testVariables';
import recordService from '../../src/services/recordService';
import appDataService from '../../src/services/appDataService';

chai.use(sinonChai);

const { expect } = chai;

describe('appDataService', () => {
  let createRecordStub;
  let uploadRecordStub;
  let deleteRecordStub;
  let updateRecordStub;
  let downloadRecordStub;
  let searchRecordsStub;

  const userId = 'user_id';
  const appDataId = 'appdata_id';

  const decryptedAppData = {
    id: appDataId,
    customCreationDate: '2017-09-19',
    user_id: userId,
    data: 'I can even be a string',
    tags: ['tag1', 'tag2', testVariables.secondTag],
    version: 1,
    status: 'Active',
    updatedDate: '2017-09-19T09:29:48.278',
  };

  const appData = {
    id: appDataId,
    customCreationDate: '2017-09-19',
    data: 'I can even be a string',
    updatedDate: '2017-09-19T09:29:48.278',
    annotations: [],
    partner: '1',
  };

  beforeEach(() => {
    createRecordStub = sinon
      .stub(recordService, 'createRecord')
      .returns(Promise.resolve(decryptedAppData));
    uploadRecordStub = sinon
      .stub(recordService, 'uploadRecord')
      .returns(Promise.resolve(decryptedAppData));
    deleteRecordStub = sinon.stub(recordService, 'deleteRecord').returns(Promise.resolve());
    updateRecordStub = sinon
      .stub(recordService, 'updateRecord')
      .returns(Promise.resolve(decryptedAppData));
    downloadRecordStub = sinon
      .stub(recordService, 'downloadRecord')
      // eslint-disable-next-line prefer-promise-reject-errors
      .returns(Promise.reject('error'));
    downloadRecordStub.withArgs(userId, appDataId).returns(Promise.resolve(decryptedAppData));

    searchRecordsStub = sinon.stub(recordService, 'searchRecords').returns(
      Promise.resolve({
        totalCount: 1,
        records: [decryptedAppData],
      })
    );
  });

  describe('fetchAppData', () => {
    it('should fetch an AppData entity', done => {
      appDataService
        .fetchAppData(userId, appDataId)
        .then(result => {
          expect(downloadRecordStub).to.be.calledWith(userId, appDataId);
          expect(downloadRecordStub).to.be.calledOnce;
          expect(result).to.be.defined;
        })
        .then(done)
        .catch(done);
    });
  });

  describe('createAppData', () => {
    it('should create an AppData entity with valid input', done => {
      const appDataEntity = 'I can even be a string';
      appDataService
        .createAppData(userId, appDataEntity)
        .then(res => {
          expect(uploadRecordStub).to.be.calledWith(userId);
          const { args: uploadRecordArgs } = uploadRecordStub.getCall(0);
          expect(JSON.stringify(uploadRecordArgs)).to.contain('flag=appdata');
          expect(uploadRecordStub).to.be.calledOnce;
          expect(res).to.deep.equal(appData);
          done();
        })
        .catch(done);
    });
  });

  describe('updateAppData', () => {
    it('should update an AppData entity correctly', done => {
      const appDataEntity = Object.assign({ sampleKey: 'SampleValue' });
      const customCreationDate = new Date();
      appDataService
        .updateAppData(userId, appDataEntity, 'id', customCreationDate)
        .then(res => {
          expect(updateRecordStub).to.be.calledOnce;
          expect(updateRecordStub).to.be.calledWith(userId, {
            id: 'id',
            data: appDataEntity,
            tags: ['flag=appdata'],
            customCreationDate,
          });
          expect(res).to.deep.equal(appData);
          done();
        })
        .catch(done);
    });
  });

  describe('fetchAppData', () => {
    it('should fetch an AppData entity correctly', done => {
      appDataService
        .fetchAppData(userId, appDataId)
        .then(res => {
          expect(downloadRecordStub).to.be.calledWith(userId, appDataId);
          expect(downloadRecordStub).to.be.calledOnce;
          expect(res).to.be.defined;
          done();
        })
        .catch(done);
    });
  });

  describe('fetchAllAppData', () => {
    it('should fetch all AppData entities by flag', done => {
      appDataService
        .fetchAllAppData(userId)
        .then(() => {
          expect(searchRecordsStub).to.be.calledWith(testVariables.userId, {
            tags: ['flag=appdata'],
          });
          done();
        })
        .catch(done);
    });
  });

  describe('deleteAppData', () => {
    it('should delete the AppData entities by id', done => {
      appDataService
        .deleteAppData(userId, appDataId)
        .then(() => {
          expect(deleteRecordStub).to.be.calledWith(testVariables.userId, appDataId);
          done();
        })
        .catch(done);
    });
  });

  afterEach(() => {
    createRecordStub.restore();
    uploadRecordStub.restore();
    deleteRecordStub.restore();
    updateRecordStub.restore();
    downloadRecordStub.restore();
    searchRecordsStub.restore();
  });
});
