/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import config from '../../src/config/index';
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import keyRoutes from '../../src/routes/keyRoutes';
import d4lRequest from '../../src/lib/d4lRequest';
import testVariables from '../testUtils/testVariables';

chai.use(sinonChai);

const { expect } = chai;

describe('userRoutes', () => {
  let requestStub: sinon.SinonStub;

  beforeEach(() => {
    requestStub = sinon.stub(d4lRequest, 'submit');
  });

  afterEach(() => {
    requestStub.restore();
  });

  it('getUserKeys passes', done => {
    requestStub
      .withArgs(
        'GET',
        // @ts-ignore
        `${config.environmentConfig.api}/keys/api/v1/keys/users/${testVariables.userId}/current-app`,
        {
          authorize: true,
        }
      )
      .returns(Promise.resolve('pass'));

    keyRoutes.getUserKeys(testVariables.userId).then(res => {
      expect(res).to.equal('pass');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub.firstCall.args[2].authorize).to.equal(true);
      expect(requestStub).to.be.calledWith('GET');
      done();
    });
  });
});
