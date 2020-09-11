// @ts-ignore
import { asymDecryptString, asymEncryptString, importKey } from 'js-crypto';
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

// eslint-disable-next-line import/prefer-default-export
export const CRYPTO_SDK = {
  asymDecryptString,
  asymEncryptString,
  createChangePasswordPayload,
  createResetPasswordPayload,
  createKeyRotationPayload,
  createLoginHash,
  createRegisterPayload,
  createShareApproveDetails,
  decryptCUP,
  getEncryptedCommonKeyWithAppPublicKey,
  generateAppKeyPair,
  importKey,
};
