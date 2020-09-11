/* eslint-disable max-nested-callbacks */
import {
  generateAsymKeyPair,
  generateSymKey,
  symEncryptObject,
  symDecryptObject,
  symDecryptString,
  asymEncryptString,
  asymDecryptString,
  keyTypes,
  // @ts-ignore
} from 'js-crypto';

import chai from 'chai';
import sinonChai from 'sinon-chai';
import { createKeyRotationPayload, createShareApproveDetails } from '../../src/utils/crypto';

chai.use(sinonChai);

const { expect } = chai;

describe('crypto', () => {
  let ownerKeys;
  let commonKey;
  let tagEncryptionKey;
  let encryptedCommonKey;
  let encryptedTagEncryptionKey;
  beforeEach(async () => {
    ownerKeys = await generateAsymKeyPair(keyTypes.USER);
    commonKey = await generateSymKey(keyTypes.COMMON_KEY);
    tagEncryptionKey = await generateSymKey(keyTypes.TAG_ENCRYPTION_KEY);
    encryptedCommonKey = await asymEncryptString(ownerKeys.publicKey, JSON.stringify(commonKey));
    encryptedTagEncryptionKey = await symEncryptObject(commonKey, tagEncryptionKey);
  });

  it('should create a new common key for rotation', async () => {
    const args = {
      permissionIdsToRevoke: [],
      permissionsToKeep: [],
      keys: {
        encryptedCommonKey,
        encryptedTagEncryptionKey,
        cap: ownerKeys.privateKey,
      },
      userPublicKey: ownerKeys.publicKey,
    };

    const { tek, common_key } = await createKeyRotationPayload(args);

    const newCommonKey = await asymDecryptString(ownerKeys.privateKey, common_key);
    const decryptedTek = await symDecryptObject(JSON.parse(newCommonKey), tek);
    expect(JSON.stringify(decryptedTek)).to.equal(JSON.stringify(tagEncryptionKey));
  });

  it('should encrypt the new common key with the public keys for all kept permissions', async () => {
    const grantees = await Promise.all(
      ['1', '2', '3', '4'].map(async id => ({
        permissionId: id,
        keys: await generateAsymKeyPair(keyTypes.USER),
      }))
    );

    const args = {
      permissionIdsToRevoke: [],
      permissionsToKeep: grantees.map(grantee => ({
        permission_id: grantee.permissionId,
        grantee_public_key: btoa(JSON.stringify(grantee.keys.publicKey)),
      })),
      keys: {
        encryptedCommonKey,
        encryptedTagEncryptionKey,
        cap: ownerKeys.privateKey,
      },
      userPublicKey: ownerKeys.publicKey,
    };
    const { shared_common_keys, common_key } = await createKeyRotationPayload(args);
    const newCommonKey = await asymDecryptString(ownerKeys.privateKey, common_key);

    await Promise.all(
      grantees.map(async grantee => {
        const { permissionId, keys } = grantee;
        const userCommonKey = shared_common_keys.find(
          update => update.permission_id === permissionId
        ).common_key;
        const decryptedCommonKey = await asymDecryptString(keys.privateKey, userCommonKey);
        expect(decryptedCommonKey).to.equal(newCommonKey);
      })
    );
  });

  it('should encrypt the common key history when approving a handshake session', async () => {
    const requesterKeys = await generateAsymKeyPair(keyTypes.USER);
    const otherCommonKey = await generateSymKey(keyTypes.COMMON_KEY);
    const otherEncryptedCommonKey = await asymEncryptString(
      ownerKeys.publicKey,
      JSON.stringify(otherCommonKey)
    );
    const currentKeyId = 'current_key';
    const otherKeyId = 'other_key';
    const tag = 'tag';
    const args = {
      tag,
      keys: {
        encryptedCommonKey,
        encryptedTagEncryptionKey,
        cap: ownerKeys.privateKey,
      },
      commonKeyHistory: [
        { common_key_id: currentKeyId, common_key: encryptedCommonKey },
        { common_key_id: otherKeyId, common_key: otherEncryptedCommonKey },
      ],
      requesterPublicKey: requesterKeys.publicKey,
    };

    const { requesterCommonKeyHistory, encryptedTag } = await createShareApproveDetails(args);

    const decryptedTag = await symDecryptString(tagEncryptionKey, encryptedTag);
    expect(decryptedTag).to.equal(tag);
    expect(requesterCommonKeyHistory.length).to.equal(2);
    const encryptedCurrentKey = requesterCommonKeyHistory.find(
      key => key.common_key_id === currentKeyId
    );
    const decryptedCurrentKey = await asymDecryptString(
      requesterKeys.privateKey,
      encryptedCurrentKey.common_key
    );
    expect(decryptedCurrentKey).to.equal(JSON.stringify(commonKey));
    const newEncryptedOtherKey = requesterCommonKeyHistory.find(
      key => key.common_key_id === otherKeyId
    );
    const decryptedOtherKey = await asymDecryptString(
      requesterKeys.privateKey,
      newEncryptedOtherKey.common_key
    );
    expect(decryptedOtherKey).to.equal(JSON.stringify(otherCommonKey));
  });
});
