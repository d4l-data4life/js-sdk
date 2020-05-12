/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fileRoutes from '../../src/routes/fileRoutes';
import d4lRequest from '../../src/lib/d4lRequest';

chai.use(sinonChai);

const { expect } = chai;

describe('fileRoutes', () => {
  let requestStub;

  beforeEach(() => {
    requestStub = sinon.stub(d4lRequest, 'submit');
  });

  it('downloadFile passes', done => {
    requestStub.returns(Promise.resolve('pass'));
    fileRoutes.downloadFile('fakeSasUrl', 'fakeDocumentBlob').then(res => {
      expect(res).to.equal('pass');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub).to.be.calledWith('GET');
      done();
    });
  });

  it('uploadFile passes', done => {
    requestStub.returns(Promise.resolve('pass'));
    fileRoutes.uploadFile('fakeSasUrl', 'fakeDocumentBlob').then(res => {
      expect(res).to.equal('pass');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub).to.be.calledWith('PUT');
      done();
    });
  });

  it('uploadFile returns error if d4lRequest returns error', done => {
    // eslint-disable-next-line prefer-promise-reject-errors
    requestStub.returns(Promise.reject('error'));

    fileRoutes.uploadFile('fakeSasUrl', 'fakeDocumentBlob').catch(res => {
      expect(res).to.equal('error');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub).to.be.calledWith('PUT');
      done();
    });
  });

  afterEach(() => {
    requestStub.restore();
  });
});
