/* eslint-disable lodash/prefer-noop */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import proxy from 'proxyquireify';
import { keyTypes } from 'hc-crypto';

import '../../src/services/createCryptoService';
import encryptionResources from '../testUtils/encryptionResources';
import userService from '../../src/services/userService';
import userResources from '../testUtils/userResources';
import testVariables from '../testUtils/testVariables';

const proxyquire = proxy(require);
chai.use(sinonChai);

describe('createCryptoService', () => {
  let createCryptoService;

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

    createCryptoService = proxyquire('../../src/services/createCryptoService', {
      'hc-crypto': {
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
        },
      },
    }).default;
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
          expect(receivedEncryptedData).to.deep.equal(encryptionResources.encryptedData);
          expect(receivedDataKey).to.deep.equal({
            commonKeyId: testVariables.commonKeyId,
            encryptedKey: encryptionResources.encryptedDataKey,
          });

          // common key
          expect(getUserStub).to.be.calledOnce;
          expect(getUserStub).to.be.calledWith(testVariables.userId);
          expect(generateSymKeyStub).to.be.calledOnce;
          expect(generateSymKeyStub).to.be.calledWith(keyTypes.DATA_KEY);
          // encryption
          expect(symEncryptStringStub).to.be.calledOnce;
          expect(symEncryptStringStub).to.be.calledWith(
            encryptionResources.dataKey,
            encryptionResources.string
          );

          done();
        })
        .catch(done);
    });
    it('should use the existing data key if provided', done => {
      const customCommonKeyId = 'custom common key id 1';

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
      const customId = 'custom common key ID';
      createCryptoService(testVariables.userId)
        .decryptData(
          {
            commonKeyId: customId,
            encryptedKey: encryptionResources.encryptedDataKey,
          },
          encryptionResources.encryptedData
        )
        .then(receivedData => {
          expect(receivedData).to.be.equal(encryptionResources.data);

          // common key
          expect(getCommonKeyStub).to.be.calledOnce;
          expect(getCommonKeyStub).to.be.calledWith(testVariables.userId, customId);
          // decryption
          expect(symDecryptObjectStub).to.be.calledOnce;
          expect(symDecryptObjectStub).to.be.calledWith(
            encryptionResources.commonKey,
            encryptionResources.encryptedDataKey
          );
          expect(symDecryptStub).to.be.calledOnce;
          expect(symDecryptStub).to.be.calledWith(
            encryptionResources.dataKey,
            encryptionResources.encryptedData
          );
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
