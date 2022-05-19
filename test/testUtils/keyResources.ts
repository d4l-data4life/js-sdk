import testVariables from './testVariables';
import encryptionResources from './encryptionResources';

const keyResources = {
  getUserKeys: {
    common_keys: {
      active_common_key_id: testVariables.commonKeyId,
      app_id: testVariables.appId,
      common_keys: [
        {
          common_key_id: testVariables.commonKeyId,
          common_key: encryptionResources.encryptedCommonKey,
        },
      ],
      tag_encryption_key: encryptionResources.encryptedTagEncryptionKey,
    },
    public_key: {
      id: 'CURRENTLY NOT USED',
      pubkey: 'CURRENTLY NOT USED',
    },
  },
};

export default keyResources;
