/* eslint-env mocha */
/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import config from '../src/config/index';
import {
  importKey,
  convertStringToArrayBufferView,
  convertArrayBufferViewToString,
  // @ts-ignore
} from 'js-crypto';
import { D4LSDK } from '../src/d4l';
import testVariables from './testUtils/testVariables';
import taggingUtils from '../src/lib/taggingUtils';
import d4lRequest from '../src/lib/d4lRequest';
import encryptionResources from './testUtils/encryptionResources';
import userService from '../src/services/userService';
import * as createCryptoService from '../src/services/createCryptoService';

chai.use(sinonChai);

const { expect } = chai;

// https://stackoverflow.com/a/7874175
const BASE_64_REGEX = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

describe('D4L', () => {
  it('the D4L object is initiated correctly', () => {
    expect(typeof D4LSDK).to.equal('object');
    expect(typeof D4LSDK.getCurrentUserId).to.equal('function');
    expect(typeof D4LSDK.reset).to.equal('function');
    expect(typeof D4LSDK.getReceivedPermissions).to.equal('function');
    expect(typeof D4LSDK.isAllowedFileType).to.equal('function');
    expect(typeof D4LSDK.grantPermission).to.equal('function');
    expect(typeof D4LSDK.crypto).to.equal('object');
    expect(typeof D4LSDK.crypto.createChangePasswordPayload).to.equal('function');
    expect(typeof D4LSDK.crypto.createResetPasswordPayload).to.equal('function');
    expect(typeof D4LSDK.crypto.createKeyRotationPayload).to.equal('function');
    expect(typeof D4LSDK.crypto.createLoginHash).to.equal('function');
    expect(typeof D4LSDK.crypto.createRegisterPayload).to.equal('function');
    expect(typeof D4LSDK.crypto.createShareApproveDetails).to.equal('function');
    expect(typeof D4LSDK.crypto.decryptCUP).to.equal('function');
    expect(typeof D4LSDK.crypto.getEncryptedCommonKeyWithAppPublicKey).to.equal('function');
    expect(typeof D4LSDK.crypto.generateAppKeyPair).to.equal('function');
    expect(typeof D4LSDK.crypto.importKey).to.equal('function');
    expect(typeof D4LSDK.createCAP).to.equal('function');
    expect(typeof D4LSDK.setup).to.equal('function');
    expect(typeof D4LSDK.models).to.equal('object');
    expect(typeof D4LSDK.models.D4LSpecialty).to.equal('object');
    expect(typeof D4LSDK.createCodeableConcept).to.equal('function');
    expect(typeof D4LSDK.models.Practitioner).to.equal('function');
    expect(typeof D4LSDK.models.DocumentReference).to.equal('function');
    expect(typeof D4LSDK.models.Attachment).to.equal('function');
  });

  describe('createCAP', () => {
    it('should make asym keypair', done => {
      D4LSDK.createCAP()
        .then(({ privateKey, publicKey }) => {
          const priv = JSON.parse(atob(privateKey));
          const pub = JSON.parse(atob(publicKey));

          expect(typeof priv.t).to.equal('string');
          expect(typeof priv.v).to.equal('number');
          expect(typeof priv.priv).to.equal('string');

          expect(typeof pub.t).to.equal('string');
          expect(typeof pub.v).to.equal('number');
          expect(typeof pub.pub).to.equal('string');
        })
        .then(() => done())
        .catch(done);
    });

    it('should seal private key', done => {
      D4LSDK.createCAP()
        .then(({ privateKey }) => D4LSDK.sealCAP(privateKey))
        .then(cryptoKey => {
          expect(cryptoKey.type).to.equal('private');
          expect(cryptoKey.extractable).to.equal(false);
          expect(cryptoKey.algorithm.name).to.equal('RSA-OAEP');
          expect(cryptoKey.usages).to.contain('decrypt');
          expect(JSON.stringify(cryptoKey)).to.equal('{}');
        })
        .then(() => done())
        .catch(done);
    });
  });

  describe('crypto', () => {
    const plainText = 'encrypt-me';
    const base64CipherText = 'Y2lwaGVyX2VuY3J5cHQtbWU=';
    describe('encryptString', () => {
      let createCryptoServiceEncryptStringSpy;
      beforeEach(() => {
        createCryptoServiceEncryptStringSpy = sinon.spy(D4LSDK.crypto, 'encryptString');
      });
      afterEach(() => {
        createCryptoServiceEncryptStringSpy.restore();
      });

      it('fails when userService.currentUserId is null', done => {
        userService.currentUserId = null;

        D4LSDK.crypto
          .encryptString('encrypt me')
          .then(() => {
            done(new Error('should have thrown setup error'));
          })
          .catch(error => {
            expect(error.message).to.equal('the SDK was not set up correctly');
            done();
          })
          .catch(done);
      });

      it('calls encryptString of the cryptoService', done => {
        userService.currentUserId = testVariables.userId;
        userService.users = {
          [testVariables.userId]: {
            commonKey: testVariables.commonKey,
            commonkeyId: testVariables.commonKeyId,
          },
        };
        userService.privateKey = testVariables.privateKey;

        D4LSDK.crypto
          .encryptString(plainText)
          .then(cipherMaterial => {
            const [result, encryptedDataKey] = cipherMaterial;
            expect(BASE_64_REGEX.test(result)).to.equal(true);
            expect(Object.keys(encryptedDataKey)[0]).to.equal('commonKeyId');
            expect(Object.keys(encryptedDataKey)[1]).to.equal('encryptedKey');
            expect(createCryptoServiceEncryptStringSpy).to.be.calledOnce;
            expect(createCryptoServiceEncryptStringSpy).to.be.calledWith(plainText);
            done();
          })
          .catch(done);
      });
    });

    describe('decryptString', () => {
      let createCryptoServiceStub;
      beforeEach(() => {
        // @ts-ignore
        createCryptoServiceStub = sinon.stub(createCryptoService).default.returns({
          decryptData: (keyInformation, cipherData) => {
            const [, plain] = convertArrayBufferViewToString(cipherData).split('_');
            return Promise.resolve(plain).then(convertStringToArrayBufferView);
          },
        });
      });

      afterEach(() => {
        createCryptoServiceStub.restore();
      });

      it('fails when userService.currentUserId is null', done => {
        userService.currentUserId = null;

        D4LSDK.crypto
          .decryptString({}, base64CipherText)
          .then(() => {
            done(new Error('should have thrown setup error'));
          })
          .catch(error => {
            expect(error.message).to.equal('the SDK was not set up correctly');
            done();
          })
          .catch(done);
      });

      it('calls decryptString of the cryptoService', done => {
        userService.currentUserId = testVariables.userId;
        userService.users = {
          [testVariables.userId]: {
            commonKey: testVariables.commonKey,
            commonkeyId: testVariables.commonKeyId,
          },
        };
        userService.commonKeys = {
          [testVariables.userId]: {
            [testVariables.commonKeyId]: testVariables.commonKey,
          },
        };
        userService.privateKey = testVariables.privateKey;

        D4LSDK.crypto
          .decryptString(
            { commonKeyId: testVariables.commonKeyId, encryptedKey: 'encryptedKey' },
            base64CipherText
          )
          .then(cipherMaterial => {
            expect(cipherMaterial).to.equal(plainText);
            expect(createCryptoServiceStub).to.be.calledOnce;
            expect(createCryptoServiceStub).to.be.calledWith(testVariables.userId);
            done();
          })
          .catch(done);
      });
    });
  });

  describe('setup', () => {
    let requestAccessTokenStub;
    let pullUserStub;

    beforeEach(() => {
      requestAccessTokenStub = sinon.stub().returns(Promise.resolve());
      pullUserStub = sinon.stub(userService, 'pullUser').returns(
        // @ts-ignore
        Promise.resolve({
          id: testVariables.userId,
          tek: encryptionResources.tagEncryptionKey,
          commonKey: {},
          commonKeyId: testVariables.commonKeyId,
        })
      );
    });

    it('makes its calls with hcKey', done => {
      D4LSDK.setup(
        testVariables.clientId,
        'development',
        btoa(JSON.stringify(encryptionResources.CUPPrivateKey)),
        requestAccessTokenStub
      )
        .then(res => {
          expect(res).to.equal(testVariables.userId);
          expect(taggingUtils.partnerId).to.equal(testVariables.partnerId);
          expect(requestAccessTokenStub).to.be.calledOnce;
          expect(d4lRequest.requestAccessToken).to.equal(requestAccessTokenStub);
          done();
        })
        .catch(done);
    });

    it('makes its calls with CryptoKey', done => {
      D4LSDK.createCAP()
        .then(({ privateKey }) => importKey(JSON.parse(atob(privateKey))))
        .then(cryptoKey =>
          D4LSDK.setup(testVariables.clientId, 'development', cryptoKey, requestAccessTokenStub)
        )
        .then(res => {
          expect(res).to.equal(testVariables.userId);
          expect(taggingUtils.partnerId).to.equal(testVariables.partnerId);
          expect(requestAccessTokenStub).to.be.calledOnce;
          expect(d4lRequest.requestAccessToken).to.equal(requestAccessTokenStub);
          done();
        })
        .catch(done);
    });

    it('makes its calls', done => {
      D4LSDK.setup(
        testVariables.clientId,
        'development',
        btoa(JSON.stringify(encryptionResources.CUPPrivateKey)),
        requestAccessTokenStub
      )
        .then(res => {
          expect(res).to.equal(testVariables.userId);
          expect(taggingUtils.partnerId).to.equal(testVariables.partnerId);
          expect(requestAccessTokenStub).to.be.calledOnce;
          expect(d4lRequest.requestAccessToken).to.equal(requestAccessTokenStub);
          done();
        })
        .catch(done);
    });

    it('fails when a non-string clientId is used as parameter', done => {
      D4LSDK.setup(
        234,
        'development',
        btoa(JSON.stringify(encryptionResources.CUPPrivateKey)),
        requestAccessTokenStub
      ).catch(error => {
        expect(error.name).to.equal('ValidationError');
        done();
      });
    });

    it('fails when an invalid clientId - no # - is used as parameter', done => {
      D4LSDK.setup(
        'invalid_client_id',
        'development',
        btoa(JSON.stringify(encryptionResources.CUPPrivateKey)),
        requestAccessTokenStub
      ).catch(error => {
        expect(error.name).to.equal('ValidationError');
        done();
      });
    });

    afterEach(() => {
      pullUserStub.restore();
      config.environmentConfig = {};
    });
  });

  describe('reset', () => {
    it('resets the state of the SDK', () => {
      taggingUtils.partnerId = 'partnerId';
      d4lRequest.currentUserId = 'currentUserId';
      d4lRequest.currentUserLanguage = 'currentUserLanguage';
      d4lRequest.masterAccessToken = 'masterAccessToken';
      d4lRequest.accessTokens = { userId: 'accessToken' };
      userService.users = { userId: {} };
      userService.currentUserId = 'currentUserId';
      userService.currentAppId = 'partnerId#web';
      userService.commonKeys = { userId: {} };

      D4LSDK.reset();

      expect(taggingUtils.partnerId).to.equal(null);
      expect(d4lRequest.currentUserId).to.equal(null);
      expect(d4lRequest.currentUserLanguage).to.equal(null);
      expect(d4lRequest.masterAccessToken).to.equal(null);
      expect(d4lRequest.accessTokens).to.deep.equal({});
      expect(userService.users).to.deep.equal({});
      expect(userService.currentUserId).to.equal(null);
      expect(userService.currentAppId).to.equal(null);
      expect(userService.commonKeys).to.deep.equal({});
    });
  });
});
