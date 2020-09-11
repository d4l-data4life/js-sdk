/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import config from '../../src/config/index';
import documentRoutes from '../../src/routes/documentRoutes';
import testVariables from '../testUtils/testVariables';
import recordResources from '../testUtils/recordResources';
import d4lRequest from '../../src/lib/d4lRequest';

chai.use(sinonChai);

const { expect } = chai;

describe('documentRoutes', () => {
  let requestStub;

  beforeEach(() => {
    requestStub = sinon.stub(d4lRequest, 'submit');
  });

  describe('createRecord', () => {
    it('passes', done => {
      const params = {
        record_id: 'fakeRecordId',
        date: '2017-08-01',
        user_id: 'fakeUserIId',
        encrypted_body: 'fakeEncryptedBody',
        encrypted_tags: ['uzydrHX/3gGWZdZ69LizEA==', '+AJ9MhikiHxSX8sD3qdurw=='],
        version: 1,
        status: 'Active',
        createdAt: '2017-09-01T13:51:53.741',
      };

      requestStub
        // @ts-ignore
        .withArgs('POST', `${config.environmentConfig.api}/users/${testVariables.userId}/records`, {
          body: params,
          authorize: true,
          ownerId: testVariables.userId,
        })
        .returns(Promise.resolve('pass'));

      documentRoutes.createRecord(testVariables.userId, params).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub).to.be.calledWith('POST');
        done();
      });
    });
  });

  describe('updateRecord', () => {
    it('passes', done => {
      const { userId, recordId } = testVariables;

      const params = {
        record_id: 'fakeRecordId',
        date: '2017-08-01',
        user_id: 'fakeUserIId',
        encrypted_body: 'fakeEncryptedBody',
        encrypted_tags: ['uzydrHX/3gGWZdZ69LizEA==', '+AJ9MhikiHxSX8sD3qdurw=='],
        version: 1,
        status: 'Active',
        createdAt: '2017-09-01T13:51:53.741',
      };

      // todo: .withArgs does not work with PUT
      requestStub.returns(Promise.resolve('pass'));

      documentRoutes.updateRecord(userId, recordId, params).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub).to.be.calledWith('PUT');
        done();
      });
    });
  });

  describe('downloadRecord', () => {
    it('passes', done => {
      const { userId, recordId } = testVariables;
      requestStub
        // @ts-ignore
        .withArgs('GET', `${config.environmentConfig.api}/users/${userId}/records/${recordId}`)
        .returns(Promise.resolve('pass'));

      documentRoutes.downloadRecord(userId, recordId).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub).to.be.calledWith('GET');
        done();
      });
    });
  });

  describe('searchRecord', () => {
    it('passes', done => {
      const searchParams = { tags: [testVariables.tag] };
      requestStub
        // @ts-ignore
        .withArgs('GET', `${config.environmentConfig.api}/users/${testVariables.userId}/records`, {
          query: searchParams,
          authorize: true,
          includeResponseHeaders: true,
          ownerId: testVariables.userId,
        })
        .resolves({
          body: [],
          headers: { 'x-total-count': recordResources.count },
        });

      documentRoutes
        .searchRecords(testVariables.userId, searchParams)
        .then(res => {
          expect(requestStub).to.be.calledOnce;
          expect(res.totalCount).to.equal(recordResources.count);
          done();
        })
        .catch(done);
    });
  });

  describe('getRecordCount', () => {
    it('passes', done => {
      const searchParmas = { tags: [testVariables.tag] };
      requestStub
        // @ts-ignore
        .withArgs('HEAD', `${config.environmentConfig.api}/users/${testVariables.userId}/records`, {
          query: searchParmas,
          authorize: true,
          includeResponseHeaders: true,
          ownerId: testVariables.userId,
        })
        .returns(
          Promise.resolve({
            body: [],
            headers: { 'x-total-count': recordResources.count },
          })
        );

      documentRoutes
        .getRecordsCount(testVariables.userId, searchParmas)
        .then(res => {
          expect(requestStub).to.be.calledOnce;
          expect(res.totalCount).to.equal(recordResources.count);
          done();
        })
        .catch(done);
    });
  });

  describe('deleteRecord', () => {
    it('passes', done => {
      const { userId, recordId } = testVariables;
      requestStub
        // @ts-ignore
        .withArgs('DELETE', `${config.environmentConfig.api}/users/${userId}/records/${recordId}`, {
          authorize: true,
          ownerId: userId,
        })
        .resolves('pass');

      documentRoutes.deleteRecord(userId, recordId).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub).to.be.calledWith('DELETE');
        done();
      });
    });
  });

  describe('fetchAttachmentKey', () => {
    it('passes', done => {
      const { userId, recordId } = testVariables;
      requestStub
        .withArgs(
          'GET',
          // @ts-ignore
          `${config.environmentConfig.api}/users/${userId}/records/${recordId}/attachment_key`,
          {
            authorize: true,
            ownerId: userId,
          }
        )
        .returns(Promise.resolve('pass'));

      documentRoutes.fetchAttachmentKey(userId, recordId).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub).to.be.calledWith('GET');
        done();
      });
    });
  });

  describe('downloadDocument', () => {
    it('passes', done => {
      const { userId, documentId } = testVariables;
      requestStub
        .withArgs(
          'GET',
          // @ts-ignore
          `${config.environmentConfig.api}/users/${userId}/documents/${documentId}`,
          {
            authorize: true,
            responseType: 'blob',
          }
        )
        .returns(Promise.resolve('pass'));

      documentRoutes.downloadDocument(userId, documentId).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub.firstCall.args[2].responseType).to.equal('blob');
        expect(requestStub).to.be.calledWith('GET');
        done();
      });
    });
  });

  describe('uploadDocument', () => {
    it('passes', done => {
      const blob = new Blob([JSON.stringify({ hello: 'world' }, null, 2)], {
        type: 'application/json',
      });

      requestStub
        .withArgs(
          'POST',
          // @ts-ignore
          `${config.environmentConfig.api}/users/${testVariables.userId}/documents`,
          {
            body: blob,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            authorize: true,
          }
        )
        .returns(Promise.resolve('pass'));

      documentRoutes.uploadDocument(testVariables.userId, blob).then(res => {
        expect(res).to.equal('pass');
        expect(requestStub).to.be.calledOnce;
        expect(requestStub.firstCall.args[2].authorize).to.equal(true);
        expect(requestStub).to.be.calledWith('POST');
        done();
      });
    });
  });

  afterEach(() => {
    requestStub.restore();
  });
});
