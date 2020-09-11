/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import config from '../../src/config/index';
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import userRoutes from '../../src/routes/userRoutes';
import d4lRequest from '../../src/lib/d4lRequest';
import testVariables from '../testUtils/testVariables';
import encryptionResources from '../testUtils/encryptionResources';
import userResources from '../testUtils/userResources';

chai.use(sinonChai);

const { expect } = chai;

describe('userRoutes', () => {
  let requestStub;

  beforeEach(() => {
    requestStub = sinon.stub(d4lRequest, 'submit');
  });

  it('resolveUserId returns error on request failure', done => {
    // eslint-disable-next-line prefer-promise-reject-errors
    requestStub.returns(Promise.reject('error')); // todo: this does not work with .withArgs

    userRoutes.resolveUserId('test').catch(err => {
      expect(err).to.equal('error');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub).to.be.calledWith('POST');
      done();
    });
  });

  it('getUserDetails passes', done => {
    requestStub
      // @ts-ignore
      .withArgs('GET', `${config.environmentConfig.api}/users/test`, {
        authorize: true,
      })
      .resolves('pass');

    userRoutes.getUserDetails('test').then(res => {
      expect(res).to.equal('pass');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub.firstCall.args[2].authorize).to.equal(true);
      expect(requestStub).to.be.calledWith('GET');
      done();
    });
  });

  it('fetchUserInfo passes', done => {
    requestStub
      // @ts-ignore
      .withArgs('GET', `${config.environmentConfig.api}/userinfo`, {
        authorize: true,
        ownerId: testVariables.userId,
      })
      .returns(Promise.resolve('pass'));

    userRoutes.fetchUserInfo(testVariables.userId).then(res => {
      expect(res).to.equal('pass');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub.firstCall.args[2].authorize).to.equal(true);
      expect(requestStub).to.be.calledWith('GET');
      done();
    });
  });

  it('updateUser passes', done => {
    const { userId } = testVariables;

    requestStub
      // @ts-ignore
      .withArgs('PUT', `${config.environmentConfig.api}/users/${userId}`, {
        authorize: true,
        body: { name: 'fakeName' },
      })
      .returns(Promise.resolve('pass'));

    userRoutes.updateUser(userId, { name: 'fakeName' }).then(res => {
      expect(res).to.equal('pass');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub.firstCall.args[2].authorize).to.equal(true);
      expect(requestStub).to.be.calledWith('PUT');
      done();
    });
  });

  it('updateUser returns error on request failure', done => {
    // eslint-disable-next-line prefer-promise-reject-errors
    requestStub.returns(Promise.reject('error'));
    // @ts-ignore
    userRoutes.updateUser({ name: 'fakeName' }).catch(err => {
      expect(err).to.equal('error');
      expect(requestStub).to.be.calledOnce;
      expect(requestStub).to.be.calledWith('PUT');
      done();
    });
  });

  describe('getReceivedPermissions', () => {
    it('passes', done => {
      const { userId } = testVariables;

      requestStub
        // @ts-ignore
        .withArgs('GET', `${config.environmentConfig.api}/users/${userId}/permissions`, {
          authorize: true,
        })
        .returns(Promise.resolve([encryptionResources.permissionResponse]));
      userRoutes
        .getReceivedPermissions(userId)
        .then(permissions => {
          expect(requestStub).to.be.calledOnce;
          expect(requestStub).to.be.calledWith('GET');
          expect(permissions[0]).to.equal(encryptionResources.permissionResponse);
          done();
        })
        .catch(done);
    });
  });

  describe('grantPermission', () => {
    it('passes when request resolves', done => {
      const { appId, userId } = testVariables;

      const body = {
        grantee: userId,
        common_key: encryptionResources.commonKey,
        app_id: appId,
        scope: userResources.scopeArray.join(' '),
      };

      requestStub
        // @ts-ignore
        .withArgs('POST', `${config.environmentConfig.api}/users/${userId}/permissions`, {
          authorize: true,
          body,
        })
        .returns(Promise.resolve());

      // todo: is user = grantee a valid use case?
      userRoutes
        .grantPermission(
          userId,
          userId,
          appId,
          encryptionResources.commonKey,
          userResources.scopeArray
        )
        .then(() => {
          expect(requestStub).to.be.calledOnce;
          expect(requestStub.firstCall.args[2].body.scope).to.equal(
            userResources.scopeArray.join(' ')
          );
          done();
        })
        .catch(done);
    });
  });

  describe('getCAP', () => {
    it('passes when request resolves', done => {
      requestStub
        // @ts-ignore
        .withArgs('GET', `${config.environmentConfig.api}/permissions`, {
          authorize: true,
          query: { app_id: testVariables.appId },
        })
        .returns(Promise.resolve());

      userRoutes
        .getCAPs(testVariables.appId)
        .then(() => {
          expect(requestStub).to.be.calledOnce;
          done();
        })
        .catch(done);
    });
  });

  afterEach(() => {
    requestStub.restore();
  });
});
