import testVariables from './testVariables';
import encryptionResources from './encryptionResources';

const userResources = {
  resolvedUser: {
    id: testVariables.userId,
  },
  currentUser: {
    id: testVariables.userId,
    alias: testVariables.userAlias,
  },
  internalUser: {
    id: testVariables.userId,
    alias: testVariables.userAlias,
    state: testVariables.state,
    tek: encryptionResources.tagEncryptionKey,
    userData: testVariables.userData,
  },
  userInfo: {
    sub: testVariables.userId,
    common_key: encryptionResources.encryptedCommonKey,
    common_key_id: testVariables.commonKeyId,
    tag_encryption_key: encryptionResources.encryptedTagEncryptionKey,
    app_id: testVariables.appId,
  },
  userDetails: {
    user: {
      id: testVariables.userId,
      email: testVariables.userAlias,
      state: testVariables.state,
      // TODO encryptedUserData, when encryption works
      tag_encryption_key: encryptionResources.tagEncryptionKey,
      // TODO encryptedUserData, when encryption works
      user_data: { encrypted_data: JSON.stringify(testVariables.userData) },
    },
  },
  cryptoUser: {
    id: testVariables.userId,
    commonKey: encryptionResources.commonKey,
    tek: encryptionResources.tagEncryptionKey,
    commonKeyId: testVariables.commonKeyId,
  },
  scopeArray: ['rec:r', 'rec:w', 'attachment:r', 'attachment:w', 'user:r', 'user:w', 'user:q'],
};

export default userResources;
