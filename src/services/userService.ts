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

export interface User {
  id: string;
  commonKey: Object;
  commonKeyId: string;
  tek: string;
}

export interface Permission {
  id: string;
  appId: string;
  owner: string;
  grantee: string;
  granteePublicKey: string;
  commonKey: Object;
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
   * @param {Object} privateKey - an unexportable CryptoKey.
   */
  setPrivateKey(privateKey): void {
    this.privateKey = privateKey;
  },

  getCurrentUserId(): string {
    if (!this.currentUserId) {
      throw new SetUpError(NOT_SETUP);
    }
    return this.currentUserId;
  },

  getCurrentAppId(): string {
    return this.currentAppId;
  },

  setCurrentUserLanguage(languageCode: string): void {
    d4lRequest.currentUserLanguage = languageCode ? String(languageCode).slice(0, 2) : null;
  },

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId;
  },

  /**
   *
   *  @param {String} userId - userId of the user whos data is requested.
   *      Loggedin user by default(even if this.currentUserId is not set yet).
   *  @returns {Promise} Resolves to a userObject that contains userId,
   *      commonKey and tagEncryptionKey
   */
  getUser(userId: string = this.currentUserId): Promise<User> {
    return this.users[userId] ? Promise.resolve(this.users[userId]) : this.pullUser(userId);
  },

  /**
   *  @param {String} userId - userId of the user whose data is requested.
   *      Loggedin user by default.
   *  @returns {Promise} Resolves to a userObject that contains userId,
   *      commonKey and tagEncryptionKey
   */
  pullUser(userId?: string): Promise<User> {
    // Does not work, if this.privateKey is not set.
    if (!this.privateKey) {
      return Promise.reject(new SetUpError(NOT_SETUP));
    }

    let commonKey;
    let commonKeyId;

    // Fetch user info. userId == null is a valid value. It seems to fetch
    // the users data.
    return userRoutes.fetchUserInfo(userId).then(res => {
      if (!userId) {
        this.currentUserId = res.sub;
        this.currentAppId = res.app_id;

        // This wouldn't be necessary, if fetch would be used with
        // this.currentUserId instead of null.
        // eslint-disable-next-line no-param-reassign
        userId = this.currentUserId;
      }
      return asymDecryptString(this.privateKey, res.common_key)
        .then(key => {
          commonKey = JSON.parse(key);
          commonKeyId = populateCommonKeyId(res.common_key_id);

          if (!this.commonKeys[userId]) {
            this.commonKeys[userId] = {};
          }
          this.commonKeys[userId][commonKeyId] = Promise.resolve(commonKey);

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
        });
    });
  },

  /**
   *  @param {String} userId - user whose key to retrieve
   *  @param {String} keyId - ID of key to retrieve
   *  @returns {Promise} Resolves to the (decrypted) common key
   */
  getCommonKey(userId: string, keyId: string): Promise<Object> {
    if (!this.commonKeys[userId]) {
      this.commonKeys[userId] = {};
    }

    if (!this.commonKeys[userId][keyId]) {
      // we set the stored common key value to the promise that fetches the common key
      // instead of setting the value once the promise resolves. This makes sure that if we call
      // the method multiple times in a short period with the same arguments,
      // only one endpoint call will be made.
      // TODO: Terra often makes multiple calls to the same endpoint. Is a similar issue to blame?
      this.commonKeys[userId][keyId] = userRoutes
        .getCommonKey(userId, keyId)
        .then(res => asymDecryptString(this.privateKey, res.common_key))
        .then(JSON.parse);
    }
    return this.commonKeys[userId][keyId];
  },

  /**
   *  @returns {Promise} Resolves to an array of received permissions.
   *      A permission contains:
   *          - permissionId: the id of the permission
   *          - appId: the id of the user-client combination that is allowed to access data
   *          - owner: the id of the user that owns the data
   *          - grantee: the id of the user that received the permission
   *          - granteePublicKey: the publicKey of the grantee (base64 encoded)
   *          - commonKey: the common key of the owner, encrypted with the grantee's
   *              public key (base64 encoded)
   *          - scope: the scope of the permission (array of strings)
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
   * @param {String} appId - the id of the user-client tuple the permission shall be granted to
   * @param {Array} annotations - the annotations that shall be shared.
   * @returns {Promise}
   */
  grantPermission(appId: string, annotations: string[] = []): Promise<void> {
    const scope = ['rec:r', 'rec:w', 'attachment:r', 'attachment:w', 'user:r', 'user:w', 'user:q'];
    let ownerId;
    let granteeId;

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
   * @param {number} interval - interval between calls in seconds
   */
  beginUserInfoPoll(interval: number): void {
    if (this.userPollAction) {
      clearInterval(this.userPollAction);
    }
    this.userPollAction = setInterval(() => this.pullUser(this.currentUserId), interval * 1000);
  },
};

export default userService;
