/* eslint-disable import/prefer-default-export */

import isString from 'lodash/isString';
import config, { envConfig } from './config/index';
import {
  convertArrayBufferViewToString,
  convertBase64ToArrayBufferView,
  generateAsymKeyPair,
  keyTypes,
  importKey,
  // @ts-ignore
} from 'js-crypto';
import fhirService from './services/fhirService';
import createCryptoService from './services/createCryptoService';
import {
  createChangePasswordPayload,
  createLoginHash,
  createShareApproveDetails,
  createRegisterPayload,
  createKeyRotationPayload,
  createResetPasswordPayload,
  decryptCUP,
  generateAppKeyPair,
  getEncryptedCommonKeyWithAppPublicKey,
} from './utils/crypto';
import { isAllowedFileType } from './lib/fileValidator';
import d4lRequest from './lib/d4lRequest';
import taggingUtils from './lib/taggingUtils';
import userService from './services/userService';
import Practitioner from './lib/models/fhir/Practitioner';
import DocumentReference from './lib/models/fhir/DocumentReference';
import {
  createCodeableConcept,
  FHIR_VERSION_STU3,
  getCodeFromCodeableConcept,
  getDisplayFromCodeableConcept,
} from './lib/models/fhir/helper';
import { throttle } from './lib/requestUtils';
import Attachment from './lib/models/fhir/Attachment';
import appDataService from './services/appDataService';
import SetupError from './lib/errors/SetupError';

export const D4LSDK = {
  getCurrentUserId: userService.getCurrentUserId.bind(userService),
  getCurrentAppId: userService.getCurrentAppId.bind(userService),
  grantPermission: userService.grantPermission.bind(userService),
  getReceivedPermissions: userService.getReceivedPermissions.bind(userService),
  setCurrentUserLanguage: userService.setCurrentUserLanguage.bind(userService),

  createAppData: appDataService.createAppData.bind(appDataService),
  fetchAppData: appDataService.fetchAppData.bind(appDataService),
  updateAppData: appDataService.updateAppData.bind(appDataService),
  deleteAppData: appDataService.deleteAppData.bind(appDataService),
  fetchAllAppData: appDataService.fetchAllAppData.bind(appDataService),

  createResource: fhirService.createResource.bind(fhirService),
  fetchResource: fhirService.fetchResource.bind(fhirService),
  updateResource: fhirService.updateResource.bind(fhirService),
  deleteResource: fhirService.deleteResource.bind(fhirService),
  countResources: fhirService.countResources.bind(fhirService),
  fetchResources: fhirService.fetchResources.bind(fhirService),
  downloadResource: fhirService.downloadResource.bind(fhirService),

  createCodeableConcept,
  getCodeFromCodeableConcept,
  getDisplayFromCodeableConcept,
  isAllowedFileType,

  crypto: {
    createChangePasswordPayload,
    createResetPasswordPayload,
    createKeyRotationPayload,
    createLoginHash,
    createRegisterPayload,
    createShareApproveDetails,
    decryptCUP,
    getEncryptedCommonKeyWithAppPublicKey,
    generateAppKeyPair,
    importKey, // pass directly from js-crypto, needed for tests
    encryptString: string =>
      new Promise(resolve =>
        resolve(userService.getCurrentUserId())
      ).then((currentUserId: string) => createCryptoService(currentUserId).encryptString(string)),
    decryptString: (keyObject, cipherString) =>
      Promise.all([
        new Promise(resolve => resolve(userService.getCurrentUserId())),
        convertBase64ToArrayBufferView(cipherString),
      ])
        .then(([currentUserId, cipherData]: [string, any]) =>
          createCryptoService(currentUserId).decryptData(keyObject, cipherData)
        )
        .then(convertArrayBufferViewToString),
  },

  throttleRequest: throttle,

  // createCAP creates exportable hcKeys (which contain a version and the primitives).
  createCAP: () =>
    generateAsymKeyPair(keyTypes.APP).then(({ publicKey, privateKey }) => ({
      publicKey: btoa(JSON.stringify(publicKey)),
      privateKey: btoa(JSON.stringify(privateKey)),
    })),

  // sealCAP creates an unexportable Promise<CryptoKey> to be used with indexedDB for storing
  // in the browser.
  sealCAP: privateKey => importKey(JSON.parse(atob(privateKey))),

  models: {
    Practitioner,
    DocumentReference,
    Attachment,
  },

  /**
   * sets up the D4L SDK
   * @param {String} clientId - the clientId provided by data4life
   * @param {String} environment - the environment in which the SDK is run
   * @param {Object} privateKey - the privateKey returned from the sealCAP method
   * @param {Function} requestAccessToken - () => Promise<String>: returns a new valid accessToken
   *      of the logged in user
   * @param {Object} extendedEnvConfig - environment config to extend the base config
   * @param {String} fhirVersion - the FHIR Version in use
   * @returns {Promise<String>} the id of the logged in user
   */
  setup({
    clientId,
    environment,
    privateKey,
    requestAccessToken,
    extendedEnvConfig = {},
    fhirVersion = FHIR_VERSION_STU3,
  }) {
    if (arguments.length > 1) {
      return Promise.reject(
        new SetupError(
          'Supplied more than one argument - starting with version 3.0.0, the SDK takes one object for its configuration as the parameter.'
        )
      );
    }
    if (!isString(clientId)) {
      return Promise.reject(
        new SetupError(
          `Not a valid clientId - must be a string, submitted  ${clientId} with type ${typeof clientId}.`
        )
      );
    }
    if (!clientId.includes('#')) {
      return Promise.reject(
        new SetupError(`Not a valid clientId - valid clientIds contain a #, ${clientId} submitted.`)
      );
    }
    taggingUtils.setPartnerId(clientId.split('#')[0]);
    config.environmentConfig = Object.assign({}, envConfig[environment], extendedEnvConfig);
    d4lRequest.requestAccessToken = requestAccessToken;
    fhirService.setFhirVersion(fhirVersion);
    userService.setPrivateKey(privateKey);
    return requestAccessToken()
      .then(accessToken => {
        d4lRequest.setMasterAccessToken(accessToken);
        // as an interim measure, we check the user info endpoint regularly
        // this is for common key rotation v1 in order to pick up on the new common key
        // it can be removed once the backend can reject out-of-date common keys
        userService.beginUserInfoPoll(config.userInfoPollInterval);
        return userService.pullUser();
      })
      .then(({ id }) => {
        d4lRequest.currentUserId = id;
        return id;
      });
  },

  /**
   * resets the SDK
   */
  reset() {
    taggingUtils.reset();
    d4lRequest.reset();
    userService.resetUser();
  },
};

export default D4LSDK;
