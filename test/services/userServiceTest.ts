/* eslint-env mocha */
/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import userService from '../../src/services/userService';
import userRoutes from '../../src/routes/userRoutes';
import keyRoutes from '../../src/routes/keyRoutes';
import { NOT_SETUP } from '../../src/lib/errors/SetupError';
import testVariables from '../testUtils/testVariables';
import userResources from '../testUtils/userResources';
import encryptionResources from '../testUtils/encryptionResources';
import keyResources from '../testUtils/keyResources';

chai.use(sinonChai);

const { expect } = chai;

describe('services/userService', () => {
  // User routes
  let getCommonKeyStub;
  let fetchUserInfoStub;
  let getReceivedPermissionsStub;
  let getCAPsStub;
  let grantPermissionStub;

  // Key routes
  let getUserKeysStub;

  beforeEach(() => {
    // User routes
    fetchUserInfoStub = sinon
      .stub(userRoutes, 'fetchUserInfo')
      .returns(Promise.resolve(userResources.userInfo));
    getCommonKeyStub = sinon.stub(userRoutes, 'getCommonKey').returns(
      Promise.resolve({
        common_key: encryptionResources.encryptedCommonKey,
      })
    );
    getReceivedPermissionsStub = sinon
      .stub(userRoutes, 'getReceivedPermissions')
      .returns(Promise.resolve([encryptionResources.permissionResponse]));
    grantPermissionStub = sinon.stub(userRoutes, 'grantPermission').returns(Promise.resolve());
    getCAPsStub = sinon
      .stub(userRoutes, 'getCAPs')
      .returns(Promise.resolve([encryptionResources.permissionResponse]));

    // Key routes
    getUserKeysStub = sinon
      .stub(keyRoutes, 'getUserKeys')
      .returns(Promise.resolve(keyResources.getUserKeys));

    userService.setPrivateKey(encryptionResources.CUPPrivateKey);
  });

  afterEach(() => {
    userService.resetUser();
    // User routes
    fetchUserInfoStub.restore();
    getCommonKeyStub.restore();
    getReceivedPermissionsStub.restore();
    grantPermissionStub.restore();
    getCAPsStub.restore();

    // Key routes
    getUserKeysStub.restore();
  });

  describe('pullUser', () => {
    it('should pull the currentUser when private key is set with cryptoKey', done => {
      userService
        .pullUser()
        .then(user => {
          expect(user).to.deep.equal(userResources.cryptoUser);

          const userId = userService.currentUserId;
          expect(userId).to.equal(testVariables.userId);

          const appId = userService.currentAppId;
          expect(appId).to.equal(testVariables.appId);

          const commonKey = userService.commonKeys[testVariables.userId][testVariables.commonKeyId];
          expect(commonKey).to.deep.equal(encryptionResources.commonKey);
          done();
        })
        .catch(done);
    });

    it('should fail when private key is not set', done => {
      userService.privateKey = null;
      userService.pullUser().catch(error => {
        expect(error.message).to.equal(NOT_SETUP);
        done();
      });
    });
  });

  describe('getUser', () => {
    it('should return not pullUser, when user is set already', done => {
      userService.users[testVariables.userId] = userResources.cryptoUser;
      userService
        .getUser(testVariables.userId)
        .then(res => {
          expect(res).to.deep.equal(userResources.cryptoUser);
          done();
        })
        .catch(done);
    });

    it('should return pullUser, when user is not set yet', done => {
      userService.users[testVariables.userId] = null;
      userService
        .getUser(testVariables.userId)
        .then(res => {
          expect(res).to.deep.equal(userResources.cryptoUser);
          done();
        })
        .catch(done);
    });
  });

  // @ts-ignore
  describe('isCurrentUser', done => {
    it('Happy Path', () => {
      userService.pullUser().then(() => {
        const isCurrentUser = userService.isCurrentUser(testVariables.userId);
        expect(isCurrentUser).to.equal(true);
        done();
      });
    });
  });

  describe('resetUser', () => {
    it('should reset the userService', () => {
      userService.resetUser();
      expect(userService.users).to.deep.equal({});
      expect(userService.currentUserId).to.equal(null);
      expect(userService.commonKeys).to.deep.equal({});
    });
  });

  describe('getCommonKey', () => {
    it('should fetch the common key from the backend if required', done => {
      userService
        .getCommonKey(testVariables.userId, testVariables.commonKeyId)
        .then(key => {
          expect(getCommonKeyStub).to.be.calledOnce;
          expect(getCommonKeyStub).to.be.calledWith(
            testVariables.userId,
            testVariables.commonKeyId
          );
          expect(key).to.deep.equal(encryptionResources.commonKey);
          done();
        })
        .catch(done);
    });

    it('should not fetch the common key if it already exists', done => {
      const fakeCommonKey = 'common key goes here';
      userService.commonKeys[testVariables.userId] = {};
      userService.commonKeys[testVariables.userId][testVariables.commonKeyId] = fakeCommonKey;
      userService
        .getCommonKey(testVariables.userId, testVariables.commonKeyId)
        .then(key => {
          expect(key).to.equal(fakeCommonKey);
          expect(getCommonKeyStub).to.not.be.called;
          done();
        })
        .catch(done);
    });
  });

  describe('getReceivedPermissions', () => {
    it('maps permissions as expected', done => {
      userService.currentUserId = testVariables.userId;
      userService
        .getReceivedPermissions()
        .then(permissions => {
          expect(getReceivedPermissionsStub).to.be.calledOnce;
          expect(getReceivedPermissionsStub).to.be.calledWith(testVariables.userId);
          expect(Object.keys(permissions[0])).to.deep.equal([
            'appId',
            'commonKey',
            'grantee',
            'granteePublicKey',
            'id',
            'owner',
            'scope',
          ]);
          done();
        })
        .catch(done);
    });

    it('should reject with not setup error when currentUserId is null', done => {
      userService
        .getReceivedPermissions()
        .catch(err => {
          expect(getReceivedPermissionsStub).not.to.be.called;
          expect(err.message).to.equal(NOT_SETUP);
          done();
        })
        .catch(done);
    });
  });

  describe('grantPermission', () => {
    it('should resolve, when all works as expected', done => {
      userService.currentUserId = testVariables.userId;
      userService.users[testVariables.userId] = userResources.cryptoUser;
      userService
        .grantPermission(testVariables.appId, [testVariables.annotation, testVariables.annotation])
        .then(() => {
          expect(getCAPsStub).to.be.calledOnce;
          expect(getCAPsStub).to.be.calledWith(testVariables.appId);
          expect(grantPermissionStub).to.be.calledWith(
            testVariables.userId,
            testVariables.userId,
            testVariables.appId
          );
          expect(grantPermissionStub.firstCall.args[4].length).to.equal(9);

          done();
        })
        .catch(done);
    });

    it('should reject with not setup error when SDK is not setup', done => {
      userService.resetUser();
      userService
        .grantPermission(testVariables.appId, [testVariables.annotation, testVariables.annotation])
        .catch(err => {
          expect(grantPermissionStub).not.to.be.called;
          expect(err.message).to.equal(NOT_SETUP);
          done();
        })
        .catch(done);
    });
  });
});
