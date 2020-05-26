/* eslint-env mocha */
/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import proxy from 'proxyquireify';
import 'js-crypto';

import '../../src/services/userService';
import '../../src/routes/userRoutes';
import { NOT_SETUP } from '../../src/lib/errors/SetupError';
import testVariables from '../testUtils/testVariables';
import userResources from '../testUtils/userResources';
import encryptionResources from '../testUtils/encryptionResources';

chai.use(sinonChai);
const proxyquire = proxy(require);

const { expect } = chai;

describe('services/userService', () => {
  let userService;
  let importKeyStub;
  let asymDecryptStub;
  let symDecryptStub;
  let getGrantedPermissionsStub;
  let getUserDetailsStub;
  let getCommonKeyStub;
  let userInfoStub;
  let resolveUserIdStub;
  let getReceivedPermissionsStub;
  let getCAPsStub;
  let grantPermissionStub;

  beforeEach(() => {
    asymDecryptStub = sinon.stub();
    symDecryptStub = sinon.stub();
    importKeyStub = sinon.stub();

    // output is set to this.privateKey
    importKeyStub
      .withArgs(
        // argument is JSON.parse(atob(privateKey))
        encryptionResources.privateKeyClientUser
      )
      .returns(Promise.resolve(encryptionResources.privateKeyClientUser));

    asymDecryptStub
      .withArgs(encryptionResources.privateKeyClientUser, encryptionResources.encryptedCommonKey)
      .returns(Promise.resolve(JSON.stringify(encryptionResources.commonKey)));

    symDecryptStub
      .withArgs(encryptionResources.commonKey, encryptionResources.encryptedTagEncryptionKey)
      .returns(Promise.resolve(encryptionResources.symHCKey));

    getGrantedPermissionsStub = sinon
      .stub()
      .returns(Promise.resolve([{ owner_id: 'a', grantee_id: 'b' }]));
    getUserDetailsStub = sinon.stub().returns(Promise.resolve(userResources.userDetails));
    userInfoStub = sinon.stub().returns(Promise.resolve(userResources.fetchUserInfo));
    resolveUserIdStub = sinon.stub().returns(
      Promise.resolve({
        uid: testVariables.userId,
      })
    );
    getReceivedPermissionsStub = sinon
      .stub()
      .returns(Promise.resolve([encryptionResources.permissionResponse]));

    getCommonKeyStub = sinon
      .stub()
      .returns(Promise.resolve({ common_key: encryptionResources.encryptedCommonKey }));

    getCAPsStub = sinon.stub().returns(Promise.resolve([encryptionResources.permissionResponse]));
    grantPermissionStub = sinon.stub().returns(Promise.resolve());

    userService = proxyquire('../../src/services/userService', {
      'js-crypto': {
        importKey: importKeyStub,
        asymDecrypt: asymDecryptStub,
        asymDecryptString: asymDecryptStub,
        symDecrypt: symDecryptStub,
        symDecryptObject: symDecryptStub,
      },
      '../routes/userRoutes': {
        default: {
          getGrantedPermissions: getGrantedPermissionsStub,
          getUserDetails: getUserDetailsStub,
          getCommonKey: getCommonKeyStub,
          fetchUserInfo: userInfoStub,
          resolveUserId: resolveUserIdStub,
          getCAPs: getCAPsStub,
          getReceivedPermissions: getReceivedPermissionsStub,
          grantPermission: grantPermissionStub,
        },
      },
    }).default;
  });

  describe('pullUser', () => {
    it('should pull the currentUser when private key is set with cryptoKey', async () => {
      userService.setPrivateKey(encryptionResources.privateKeyClientUser);
      const res = await userService.pullUser();
      const userId = userService.currentUserId;
      const appId = userService.currentAppId;
      expect(userId).to.equal(testVariables.userId);
      expect(appId).to.equal(testVariables.appId);
      expect(res).to.deep.equal(userResources.cryptoUser);
      const commonKey = await userService.commonKeys[testVariables.userId][
        testVariables.commonKeyId
      ];

      expect(commonKey).to.deep.equal(encryptionResources.commonKey);
    });

    it('should fail when private key is not set', done => {
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
      userService.setPrivateKey(encryptionResources.privateKeyClientUser);
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

  describe('isCurrentUser', done => {
    it('Happy Path', () => {
      userService.setPrivateKey(encryptionResources.privateKeyClientUser);
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
      userService.setPrivateKey(encryptionResources.privateKeyClientUser);
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
      userService.setPrivateKey(encryptionResources.privateKeyClientUser);
      userService.commonKeys[testVariables.userId] = {};
      userService.commonKeys[testVariables.userId][testVariables.commonKeyId] = Promise.resolve(
        fakeCommonKey
      );
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

    it('should reject with not setup error when currentUserId is null', done => {
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
