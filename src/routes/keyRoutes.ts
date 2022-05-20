import config from '../config/index';
import d4lRequest from '../lib/d4lRequest';

const keyRoutes = {
  /**
   * Get the application specific common and public keys for the current app for a specific user
   * @param userId The id of the user to get the keys for
   * @returns All common keys and the public key belonging to the user
   */
  async getUserKeys(
    userId: string
  ): Promise<{
    common_keys: {
      active_common_key_id: string;
      app_id: string;
      common_keys: { common_key_id: string; common_key: string }[];
      tag_encryption_key: string;
    };
    public_key: {
      id: string;
      pubkey: string;
    };
  }> {
    return d4lRequest.submit(
      'GET',
      `${config.apiUrl()}/keys/api/v1/keys/users/${userId}/current-app`,
      {
        authorize: true,
      }
    );
  },
};

export default keyRoutes;
