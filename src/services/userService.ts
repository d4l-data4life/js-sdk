import {
  asymDecryptString,
  symDecryptObject,
  asymEncryptString,
  symEncryptString,
  // @ts-ignore
} from 'js-crypto';

import userRoutes from '../routes/userRoutes';
import d4lRequest from '../lib/d4lRequest';
import taggingUtils from '../lib/taggingUtils';
import SetUpError, { NOT_SETUP } from '../lib/errors/SetupError';
import { populateCommonKeyId } from '../lib/cryptoUtils';

// todo: there should be a base Key class that is expanded upon in js-crypto
export interface SymKey {
  t: string;
  v: number;
  sym: string;
}

export interface User {
  id: string;
  commonKey: SymKey;
  commonKeyId: string;
  tek: SymKey;
}

export interface Permission {
  id: string;
  appId: string;
  owner: string;
  grantee: string;
  granteePublicKey: string;
  commonKey: SymKey;
  scope: string[];
}

const userService = {
  currentUserId: null,
  currentAppId: null,
  users: {},
  commonKeys: {},
  privateKey: null, // WebCrypto Object
  userPollAction: null,

  resetUser(): void {
    this.users = {};
    this.currentUserId = null;
    this.currentAppId = null;
    this.privateKey = null;
    this.commonKeys = {};
    if (this.userPollAction) {
      clearInterval(this.userPollAction);
      this.userPollAction = null;
    }
  },

  /**
   * Sets the loggedin user's privateKey.
   *
   * CryptoKey: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
   *
   * @param privateKey  an unexportable CryptoKey.
   */
  setPrivateKey(privateKey: any): void {
    this.privateKey = privateKey;
  },

  /**
   * Get the id of the current user
   */
  getCurrentUserId(): string {
    if (!this.currentUserId) {
      throw new SetUpError(NOT_SETUP);
    }
    return this.currentUserId;
  },

  /**
   * Get the id of the current app
   */
  getCurrentAppId(): string {
    return this.currentAppId;
  },

  /**
   * Set a language for the current user
   * @param languageCode The code of the language that should be set
   */
  setCurrentUserLanguage(languageCode: string): void {
    d4lRequest.currentUserLanguage = languageCode ? String(languageCode).slice(0, 2) : null;
  },

  /**
   * Check if a the id is the one of the current user
   * @param userId The id to check
   */
  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId;
  },

  /**
   * Get the user for an id.
   * Defaults to `this.currentUserId`.
   *  @param userId Id of the user whos data is requested.
   *                Loggedin user by default(even if `this.currentUserId` is not set yet).
   *  @returns Resolves to a userObject that contains `userId`, `commonKey` and `tagEncryptionKey`.
   */
  getUser(userId: string = this.currentUserId): Promise<User> {
    return this.users[userId] ? Promise.resolve(this.users[userId]) : this.pullUser(userId);
  },

  /**
   * Get the user for an id.
   *  @param userId Id of the user whos data is requested.
   *                Loggedin user by default(even if `this.currentUserId` is not set yet).
   * @returns Resolves to a userObject that contains `userId`, `commonKey` and `tagEncryptionKey`.
   */
  pullUser(userId?: string): Promise<User> {
    // Does not work, if this.privateKey is not set.
    if (!this.privateKey) {
      return Promise.reject(new SetUpError(NOT_SETUP));
    }

    let commonKey: any;
    let commonKeyId: string;

    // Fetch user info. userId == null is a valid value. It seems to fetch
    // the users data.
    return userRoutes
      .fetchUserInfo(userId)
      .then(res => {
        if (!userId) {
          this.currentUserId = res.sub;
          this.currentAppId = res.app_id;

          // This wouldn't be necessary, if fetch would be used with
          // this.currentUserId instead of null.
          // eslint-disable-next-line no-param-reassign
          userId = this.currentUserId;
        }
        return res;
      })
      .then(res =>
        asymDecryptString(this.privateKey, res.common_key)
          .then(key => {
            commonKey = JSON.parse(key);
            commonKeyId = populateCommonKeyId(res.common_key_id);

            if (!this.commonKeys[userId]) {
              this.commonKeys[userId] = {};
            }
            this.commonKeys[userId][commonKeyId] = commonKey;

            return symDecryptObject(commonKey, res.tag_encryption_key);
          })
          .then(tek => {
            this.users[userId] = {
              id: userId,
              commonKey,
              commonKeyId,
              tek,
            };

            return this.users[userId];
          })
      );
  },

  /**
   * Get the `commonKey` for a user
   * @param userId  Id of the user whose key to retrieve
   * @param keyId  Id of key to retrieve
   * @returns Resolves to the (decrypted) common key
   */
  async getCommonKey(userId: string, keyId: string): Promise<Record<string, any>> {
    if (!this.commonKeys[userId]) {
      this.commonKeys[userId] = {};
    }

    if (!this.commonKeys[userId][keyId]) {
      // we set the stored common key value to the promise that fetches the common key
      // instead of setting the value once the promise resolves. This makes sure that if we call
      // the method multiple times in a short period with the same arguments,
      // only one endpoint call will be made.
      // TODO: Terra often makes multiple calls to the same endpoint. Is a similar issue to blame?
      this.commonKeys[userId][keyId] = await userRoutes
        .getCommonKey(userId, keyId)
        .then(res => asymDecryptString(this.privateKey, res.common_key))
        .then(JSON.parse);
    }
    return this.commonKeys[userId][keyId];
  },

  /**
   * Get a list of received permissions
   *
   * @returns Resolves to an array of received permissions.
   *      A permission contains:
   *          - `permissionId`: the id of the permission
   *          - `appId`: the id of the user-client combination that is allowed to access data
   *          - `owner`: the id of the user that owns the data
   *          - `grantee`: the id of the user that received the permission
   *          - `granteePublicKey`: the publicKey of the grantee (base64 encoded)
   *          - `commonKey`: the common key of the owner, encrypted with the grantee's
   *              public key (base64 encoded)
   *          - `scope`: the scope of the permission (array of strings)
   *
   * TODO: decide on which data should be exposed
   */
  getReceivedPermissions(): Promise<Permission[]> {
    return new Promise(resolve => resolve(this.getCurrentUserId()))
      .then((currentUserId: string) => userRoutes.getReceivedPermissions(currentUserId))
      .then(permissions =>
        permissions.map(
          ({
            app_id: appId,
            common_key: commonKey,
            grantee,
            grantee_public_key: granteePublicKey,
            id,
            owner,
            scope,
          }) => ({
            appId,
            commonKey,
            grantee,
            granteePublicKey,
            id,
            owner,
            scope: scope.split(' '),
          })
        )
      );
  },

  /**
   * Grant permissions to a certain app
   * @param appId The id of the user-client tuple the permission shall be granted to
   * @param annotations The annotations that shall be shared.
   */
  grantPermission(appId: string, annotations: string[] = []): Promise<void> {
    const scope = ['rec:r', 'rec:w', 'attachment:r', 'attachment:w', 'user:r', 'user:w', 'user:q'];
    let ownerId: string;
    let granteeId: string;

    return Promise.all([userRoutes.getCAPs(appId), this.getUser()])
      .then(([CAPs, user]) => {
        const CAP = CAPs[0]; // eslint-disable-line prefer-destructuring
        ownerId = user.id;
        granteeId = CAP.owner;
        const publicKey = JSON.parse(atob(CAP.grantee_public_key));
        const commonKeyString = JSON.stringify(user.commonKey);
        const commonKeyPromise = asymEncryptString(publicKey, commonKeyString);

        const annotationsPromise = Promise.all(
          annotations.map(annotation =>
            symEncryptString(user.tek, taggingUtils.buildTag('custom', annotation))
          )
        );

        return Promise.all([commonKeyPromise, annotationsPromise]);
      })
      .then(([commonKey, cipherAnnotations]) => {
        const annotationScope = cipherAnnotations.map(annotation => `tag:${annotation}`);
        return userRoutes.grantPermission(ownerId, granteeId, appId, commonKey, [
          ...scope,
          ...annotationScope,
        ]);
      });
  },

  /**
   * Starts a regular, recurring call to /userinfo to get common key updates
   * @param interval interval between calls in seconds
   */
  beginUserInfoPoll(interval: number): void {
    if (this.userPollAction) {
      clearInterval(this.userPollAction);
    }
    this.userPollAction = setInterval(() => this.pullUser(this.currentUserId), interval * 1000);
  },
};

export default userService;
