/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
// @ts-ignore
import proxy from 'proxyquireify';
// @ts-ignore
import * as jsCrypto from 'js-crypto';

import createCryptoService from '../../src/services/createCryptoService';
import encryptionResources from '../testUtils/encryptionResources';
import userService from '../../src/services/userService';
import userResources from '../testUtils/userResources';
import testVariables from '../testUtils/testVariables';

const proxyquire = proxy(require);
chai.use(sinonChai);

describe('createCryptoService', () => {
  // let createCryptoService;

  let getUserStub;
  let getCommonKeyStub;
  let asymDecryptStringStub;
  let asymEncrypt;
  let generateSymKeyStub;
  let symEncryptObjectStub;
  let symEncryptStub;
  let symEncryptStringStub;
  let symDecryptStub;
  let symDecryptStringStub;
  let symDecryptObjectStub;
  let symDecryptDataKey;
  let symDecryptData;

  beforeEach(() => {
    /*
    getUserStub = sinon.stub().returns(Promise.resolve(userResources.cryptoUser));

    getCommonKeyStub = sinon.stub().returns(Promise.resolve(encryptionResources.commonKey));

    asymDecryptStringStub = sinon
      .stub()
      .returns(Promise.resolve(JSON.stringify(encryptionResources.commonKey)));

    generateSymKeyStub = sinon.stub().returns(Promise.resolve(encryptionResources.dataKey));

    symEncryptStub = sinon.stub().returns(Promise.resolve(encryptionResources.encryptedData));

    symEncryptStringStub = sinon.stub().returns(Promise.resolve(encryptionResources.encryptedData));

    symEncryptObjectStub = sinon
      .stub()
      .returns(Promise.resolve(encryptionResources.encryptedDataKey));

    symDecryptObjectStub = sinon.stub().returns(Promise.resolve(encryptionResources.dataKey));

    symDecryptStub = sinon.stub().returns(Promise.resolve(encryptionResources.data));

    symDecryptStringStub = sinon
      .stub()
      .returns(Promise.resolve(JSON.stringify(encryptionResources.dataKey)));
    */
    /*
    createCryptoService = proxyquire('../../src/services/createCryptoService', {
      'js-crypto': {
        asymDecryptString: asymDecryptStringStub,
        generateSymKey: generateSymKeyStub,
        symEncrypt: symEncryptStub,
        symEncryptString: symEncryptStringStub,
        symEncryptObject: symEncryptObjectStub,
        symDecryptObject: symDecryptObjectStub,
        symDecrypt: symDecryptStub,
        symDecryptString: symDecryptStringStub,
        keyTypes,
      },
      './userService': {
        default: {
          getUser: getUserStub,
          getCommonKey: getCommonKeyStub,
          pullUser: getUserStub,
        },
      },
    }).default;
    */

    userService.currentUserId = testVariables.userId;
    // TODO: maybe use another key as an alternativecommonkey
    userService.commonKeys = {
      [testVariables.userId]: {
        //'some old common key id': encryptionResources.symHCKey,
        [testVariables.commonKeyId]: encryptionResources.commonKey,
        [testVariables.alternativeCommonKeyId]: encryptionResources.commonKey,
      },
    };
    userService.users = {
      [testVariables.userId]: userResources.cryptoUser,
    };
  });

  describe('encryptString', () => {
    let encryptString;
    let getCommonKeySpy;
    beforeEach(() => {
      // eslint-disable-next-line prefer-destructuring
      encryptString = createCryptoService(testVariables.userId).encryptString;
      getCommonKeySpy = sinon.spy(userService, 'getCommonKey');
    });
    afterEach(() => {
      getCommonKeySpy.restore();
    });

    it('encrypts a string (happy path) without a provided data key', done => {
      encryptString(encryptionResources.string)
        .then(([receivedEncryptedData, receivedDataKey]) => {
          expect(receivedEncryptedData.length).to.equal(48);
          expect(receivedDataKey.commonKeyId).to.equal(testVariables.commonKeyId);
          expect(receivedDataKey.encryptedKey.length).to.equal(132);
          expect(getCommonKeySpy).not.to.be.called;
          done();
        })
        .catch(done);
    });
    it('should use the existing data key if provided', done => {
      const customCommonKeyId = testVariables.alternativeCommonKeyId;
      const encryptedDataKey =
        'WiLqmhgYAcKWYzRcwxi+ixCsRuqrUF7Z6ShCBt8qlLnDSfLp6mBp/kDs3F1F6FLeCiYlQ1r8HJXzMobM5Y0rAvIltlO68oBVZjv1HUVHxP1efwHnhn5TNGJaEAEWiVTcHw==';

      encryptString(encryptionResources.string, {
        commonKeyId: customCommonKeyId,
        encryptedKey: encryptedDataKey,
      })
        .then(([receivedEncryptedData, receivedDataKey]) => {
          expect(receivedEncryptedData.length).to.equal(48);
          expect(receivedDataKey.commonKeyId).to.equal(testVariables.alternativeCommonKeyId);
          expect(receivedDataKey.encryptedKey.length).to.equal(132);
          expect(getCommonKeySpy).to.be.calledOnce;
          done();
        })
        .catch(done);
    });
  });

  describe('decryptData', () => {
    it('should be possible to decrypt document', done => {
      // @Burtchen this test used an alternative commonKey. Maybe it makes sense to also do it here
      const customId = testVariables.alternativeCommonKeyId;
      const encryptedDataKey =
        'WiLqmhgYAcKWYzRcwxi+ixCsRuqrUF7Z6ShCBt8qlLnDSfLp6mBp/kDs3F1F6FLeCiYlQ1r8HJXzMobM5Y0rAvIltlO68oBVZjv1HUVHxP1efwHnhn5TNGJaEAEWiVTcHw==';
      const encryptedDataString = 'K/7R2UJVxcOs3oH66868mTO/sGmYeZrJNlx52leEMcrAIA==';
      const encryptedData = jsCrypto.default.convertBase64ToArrayBufferView(encryptedDataString);
      const decryptedData = new Uint8Array([115, 116, 114, 105, 110, 103]);

      createCryptoService(testVariables.userId)
        .decryptData(
          {
            commonKeyId: customId,
            encryptedKey: encryptedDataKey,
          },
          encryptedData
        )
        .then(receivedData => {
          expect(receivedData).to.deep.equal(decryptedData);

          // // common key
          // expect(getCommonKeyStub).to.be.calledOnce;
          // expect(getCommonKeyStub).to.be.calledWith(testVariables.userId, customId);
          // // decryption
          // expect(symDecryptObjectStub).to.be.calledOnce;
          // expect(symDecryptObjectStub).to.be.calledWith(
          //   encryptionResources.commonKey,
          //   encryptionResources.encryptedDataKey
          // );
          // expect(symDecryptStub).to.be.calledOnce;
          // expect(symDecryptStub).to.be.calledWith(
          //   encryptionResources.dataKey,
          //   encryptionResources.encryptedData
          // );
        })
        .then(() => done())
        .catch(done);
    });
  });

  describe('updateKeys', () => {
    let symDecryptObjectSpy;
    let symEncryptObjectSpy;
    let getCommonKeyStub;
    beforeEach(() => {
      getCommonKeyStub = sinon.stub(userService, 'getCommonKey');
      getCommonKeyStub.returns(encryptionResources.commonKey);
      symDecryptObjectSpy = sinon.spy(jsCrypto.default.symDecryptObject);
      symEncryptObjectSpy = sinon.spy(jsCrypto.default.symEncryptObject);
    });
    afterEach(() => {
      getCommonKeyStub.restore();
      symDecryptObjectSpy.resetHistory(); // can't use restore because we are not spying on a method via string
      symEncryptObjectSpy.resetHistory();
    });

    it('should update a single key with the newest common key', done => {
      const oldCommonKeyId = testVariables.commonKeyId;
      const oldEncryptedKey =
        'WiLqmhgYAcKWYzRcwxi+ixCsRuqrUF7Z6ShCBt8qlLnDSfLp6mBp/kDs3F1F6FLeCiYlQ1r8HJXzMobM5Y0rAvIltlO68oBVZjv1HUVHxP1efwHnhn5TNGJaEAEWiVTcHw==';

      createCryptoService(testVariables.userId)
        .updateKeys({
          commonKeyId: 'old common key id',
          encryptedKey: oldEncryptedKey,
        })
        .then(updatedKey => {
          // todo: deep equal check or result for encryptedKey itself
          expect(updatedKey[0].commonKeyId).to.equal(testVariables.commonKeyId);
          expect(getCommonKeyStub).to.be.calledOnce;
          expect(getCommonKeyStub).to.be.calledWith(testVariables.userId, 'old common key id');
          done();
        })
        .catch(done);
    });

    it('should not re-encrypt a key that is already encrypted with the correct common key', done => {
      const encryptedKey = 'some encrypted key';
      const encryptedKeyInfo = {
        commonKeyId: testVariables.commonKeyId,
        encryptedKey,
      };
      createCryptoService(testVariables.userId)
        .updateKeys(encryptedKeyInfo)
        .then(updatedKey => {
          expect(updatedKey).to.deep.equal([encryptedKeyInfo]);
          expect(symDecryptObjectSpy).to.not.be.called;
          expect(symEncryptObjectSpy).to.not.be.called;
          done();
        })
        .catch(done);
    });

    it('should encrypt multiple keys with the same common key', done => {
      const oldCommonKeyId = 'a common key id';
      const oldEncryptedKey1 = 'encrypted key 1';
      const oldEncryptedKey2 = 'encrypted key 2';
      createCryptoService(testVariables.userId)
        .updateKeys(
          { commonKeyId: oldCommonKeyId, encryptedKey: oldEncryptedKey1 },
          { commonKeyId: oldCommonKeyId, encryptedKey: oldEncryptedKey2 }
        )
        .then(updatedKeys => {
          expect(updatedKeys).to.have.length(2);
          expect(symDecryptObjectStub).to.be.calledTwice;
          expect(symDecryptObjectStub).to.be.calledWith(
            encryptionResources.commonKey,
            oldEncryptedKey1
          );
          expect(symDecryptObjectStub).to.be.calledWith(
            encryptionResources.commonKey,
            oldEncryptedKey2
          );
          done();
        })
        .catch(done);
    });
  });
});
