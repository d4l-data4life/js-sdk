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
import { keyTypes, convertBase64ToArrayBufferView } from 'js-crypto';

import createCryptoService from '../../src/services/createCryptoService';
import encryptionResources from '../testUtils/encryptionResources';
import userService from '../../src/services/userService';
import userResources from '../testUtils/userResources';
import testVariables from '../testUtils/testVariables';

const proxyquire = proxy(require);
chai.use(sinonChai);

describe.only('createCryptoService', () => {
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
    beforeEach(() => {
      // eslint-disable-next-line prefer-destructuring
      encryptString = createCryptoService(testVariables.userId).encryptString;
    });

    it('happyPath', done => {
      encryptString(encryptionResources.string)
        .then(([receivedEncryptedData, receivedDataKey]) => {
          console.log(JSON.stringify(receivedDataKey), receivedEncryptedData);
          expect(receivedEncryptedData.length).to.equal(48);
          expect(receivedDataKey.commonKeyId).to.equal(testVariables.commonKeyId);
          expect(receivedDataKey.encryptedKey.length).to.equal(132);
          // common key
          // expect(getUserStub).to.be.calledOnce;
          // expect(getUserStub).to.be.calledWith(testVariables.userId);
          // expect(generateSymKeyStub).to.be.calledOnce;
          // expect(generateSymKeyStub).to.be.calledWith(keyTypes.DATA_KEY);
          // // encryption
          // expect(symEncryptStringStub).to.be.calledOnce;
          // expect(symEncryptStringStub).to.be.calledWith(
          //   encryptionResources.dataKey,
          //   encryptionResources.string
          // );

          done();
        })
        .catch(done);
    });
    it('should use the existing data key if provided', done => {
      const customCommonKeyId = testVariables.alternativeCommonKeyId;

      encryptString(encryptionResources.string, {
        commonKeyId: customCommonKeyId,
        encryptedKey: encryptionResources.encryptedDataKey,
      }).then(([receivedEncryptedData, receivedDataKey]) => {
        expect(getCommonKeyStub).to.be.calledOnce;
        expect(getCommonKeyStub).to.be.calledWith(testVariables.userId, customCommonKeyId);
        expect(generateSymKeyStub).to.not.be.called;
        done();
      });
    });
  });

  describe('decryptData', () => {
    it('should be possible to decrypt document', done => {
      // @Burtchen this test used an alternative commonKey. Maybe it makes sense to also do it here
      const customId = testVariables.alternativeCommonKeyId;
      const encryptedDataKey =
        'WiLqmhgYAcKWYzRcwxi+ixCsRuqrUF7Z6ShCBt8qlLnDSfLp6mBp/kDs3F1F6FLeCiYlQ1r8HJXzMobM5Y0rAvIltlO68oBVZjv1HUVHxP1efwHnhn5TNGJaEAEWiVTcHw==';
      const encryptedDataString = 'K/7R2UJVxcOs3oH66868mTO/sGmYeZrJNlx52leEMcrAIA==';
      const encryptedData = convertBase64ToArrayBufferView(encryptedDataString);
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
    it('should update a single key with the newest common key', done => {
      const oldCommonKeyId = 'some old common key id';
      const oldEncryptedKey = 'old encrypted key';
      createCryptoService(testVariables.userId)
        .updateKeys({
          commonKeyId: oldCommonKeyId,
          encryptedKey: oldEncryptedKey,
        })
        .then(updatedKey => {
          expect(updatedKey).to.deep.equal([
            {
              commonKeyId: testVariables.commonKeyId,
              encryptedKey: encryptionResources.encryptedDataKey,
            },
          ]);

          expect(getUserStub).to.be.called;

          expect(getCommonKeyStub).to.be.called;
          expect(getCommonKeyStub).to.be.calledWith(testVariables.userId, oldCommonKeyId);

          expect(symDecryptObjectStub).to.be.calledOnce;
          expect(symDecryptObjectStub).to.be.calledWith(
            encryptionResources.commonKey,
            oldEncryptedKey
          );

          expect(symEncryptObjectStub).to.be.calledOnce;
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
          expect(symDecryptObjectStub).to.not.be.called;
          expect(symEncryptObjectStub).to.not.be.called;
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
