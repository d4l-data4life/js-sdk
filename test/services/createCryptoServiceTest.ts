/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */

import 'babel-polyfill';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import createCryptoService from '../../src/services/createCryptoService';
import encryptionResources from '../testUtils/encryptionResources';
import userService from '../../src/services/userService';
import userResources from '../testUtils/userResources';
import testVariables from '../testUtils/testVariables';

import { convertBase64ToArrayBufferView } from 'js-crypto';

chai.use(sinonChai);

describe('createCryptoService', () => {
  beforeEach(() => {
    userService.currentUserId = testVariables.userId;
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
    let getCommonKeySpy;
    beforeEach(() => {
      getCommonKeySpy = sinon.spy(userService, 'getCommonKey');
    });
    afterEach(() => {
      getCommonKeySpy.restore();
    });

    it('should be possible to decrypt a document', done => {
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
          expect(getCommonKeySpy).to.be.calledOnce;
          expect(getCommonKeySpy).to.be.calledWith(testVariables.userId, customId);
        })
        .then(() => done())
        .catch(done);
    });
  });

  describe('updateKeys', () => {
    let getCommonKeyStub;
    const oldEncryptedKey =
      'WiLqmhgYAcKWYzRcwxi+ixCsRuqrUF7Z6ShCBt8qlLnDSfLp6mBp/kDs3F1F6FLeCiYlQ1r8HJXzMobM5Y0rAvIltlO68oBVZjv1HUVHxP1efwHnhn5TNGJaEAEWiVTcHw==';

    beforeEach(() => {
      getCommonKeyStub = sinon.stub(userService, 'getCommonKey');
      getCommonKeyStub.returns(encryptionResources.commonKey);
    });
    afterEach(() => {
      getCommonKeyStub.restore();
    });

    it('should update a single key with the newest common key', done => {
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
          done();
        })
        .catch(done);
    });

    it('should encrypt multiple keys with the same common key', done => {
      const oldCommonKeyId = 'a common key id';
      const oldEncryptedKey1 = oldEncryptedKey;
      const oldEncryptedKey2 = oldEncryptedKey;
      createCryptoService(testVariables.userId)
        .updateKeys(
          { commonKeyId: oldCommonKeyId, encryptedKey: oldEncryptedKey1 },
          { commonKeyId: oldCommonKeyId, encryptedKey: oldEncryptedKey2 }
        )
        .then(updatedKeys => {
          expect(updatedKeys).to.have.length(2);
          expect(getCommonKeyStub).to.be.calledTwice;
          done();
        })
        .catch(done);
    });
  });
});
