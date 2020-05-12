/* eslint-disable no-return-await */
import {
  deriveKey,
  newDerivationSalt,
  generateAsymKeyPair,
  convertBase64ToArrayBufferView,
  convertStringToArrayBufferView,
  convertArrayBufferViewToBase64,
  symEncryptString,
  symDecryptString,
  symEncryptObject,
  symDecryptObject,
  asymEncryptString,
  asymDecryptString,
  generateSymKey,
  keyTypes,
  algorithms,
  // @ts-ignore
} from 'hc-crypto';

// base64
type b64 = string;

type HcSymmetricKey = {
  v: number;
  t: string;
  sym: b64;
};

type CryptoServiceParams = {
  password_hash: b64;
  password_key_salt: b64;
  cup: b64;

  recovery_password_hash: b64;
  recovery_password_key_salt: b64;
  recovery_cup: b64;

  public_key: b64;
  tag_encryption_key: b64;
  common_key: b64;

  email: string;
};

type KeyDetails = {
  cap: CryptoKey;
  encryptedCommonKey: b64;
  encryptedTagEncryptionKey: b64;
};

/**
 * This function assures that the creation of the authentication hash is the same
 * on login and on registration.
 */
const createLoginHashFromBytes = async (password: Uint8Array): Promise<b64> => {
  const { sym } = await deriveKey(password);

  return sym;
};

export const createLoginHash = async (password: string): Promise<b64> =>
  await createLoginHashFromBytes(convertStringToArrayBufferView(password));

const createKeyMaterial = async (key: string) => {
  const keyAsBytes = convertStringToArrayBufferView(key);
  const loginHash = await createLoginHashFromBytes(keyAsBytes);
  const cupSalt = await newDerivationSalt();
  const cupKey = await deriveKey(keyAsBytes, cupSalt);
  const cupSaltAsB64 = convertArrayBufferViewToBase64(cupSalt);

  // This is a rough step, but this information MUST NOT leak to our backend then!
  if (loginHash === cupKey.sym) {
    throw Error('Creating cryptographic material in a secure way failed!');
  }

  return {
    loginHash,
    cupKey,
    cupSaltAsB64,
  };
};

const decryptUserKeys = async (keys: KeyDetails) => {
  const { cap, encryptedCommonKey, encryptedTagEncryptionKey } = keys;
  const decCommonKey = await asymDecryptString(cap, encryptedCommonKey);
  const decTagEncryptionKey = await symDecryptObject(
    JSON.parse(decCommonKey),
    encryptedTagEncryptionKey
  );
  return {
    cap,
    tagEncryptionKey: decTagEncryptionKey,
    currentCommonKey: decCommonKey,
  };
};

type ApproveArguments = {
  keys: KeyDetails;
  commonKeyHistory: { common_key_id: string; common_key: string }[];
  requesterPublicKey: CryptoKey;
  tag: string;
};

export const createShareApproveDetails = async (args: ApproveArguments) => {
  const { keys, requesterPublicKey, tag, commonKeyHistory } = args;
  const { tagEncryptionKey } = await decryptUserKeys(keys);
  const encCommonKeyHistory = await Promise.all(
    commonKeyHistory.map(async keyInfo => {
      const { common_key_id, common_key } = keyInfo;
      const decryptedCommonKey = await asymDecryptString(keys.cap, common_key);
      const granteeCommonKey = await asymEncryptString(requesterPublicKey, decryptedCommonKey);
      return { common_key_id, common_key: granteeCommonKey };
    })
  );

  const encryptedTag = await symEncryptString(tagEncryptionKey, tag);

  return {
    encryptedTag,
    requesterCommonKeyHistory: encCommonKeyHistory,
  };
};

type Permission = {
  permission_id: string;
  grantee_public_key: string;
};

type KeyRotationArguments = {
  permissionIdsToRevoke: string[];
  permissionsToKeep: Permission[];
  keys: KeyDetails;
  userPublicKey: CryptoKey;
};

export const createKeyRotationPayload = async (args: KeyRotationArguments) => {
  const createPermissionUpdate = async (permission: Permission, newKey: HcSymmetricKey) => {
    const publicKey = JSON.parse(atob(permission.grantee_public_key));
    const encrypted = await asymEncryptString(publicKey, JSON.stringify(newKey));
    return { permission_id: permission.permission_id, common_key: encrypted };
  };

  const { permissionIdsToRevoke, permissionsToKeep, keys, userPublicKey } = args;
  const { tagEncryptionKey } = await decryptUserKeys(keys);

  const rawCommonKey = await generateSymKey(keyTypes.COMMON_KEY);

  const encryptedCommonKey = await asymEncryptString(userPublicKey, JSON.stringify(rawCommonKey));
  const encryptedTek = await symEncryptObject(rawCommonKey, tagEncryptionKey);

  const permissionUpdates = await Promise.all(
    permissionsToKeep.map(permission => createPermissionUpdate(permission, rawCommonKey))
  );

  return {
    tek: encryptedTek,
    common_key: encryptedCommonKey,
    revoked_grantees: permissionIdsToRevoke,
    shared_common_keys: permissionUpdates,
  };
};

/**
 * This creates the necessary crypto material necessary for registering a user.
 * Could be outsourced to hc-crypto-js.
 */
export const createRegisterPayload = async (
  email: string,
  password: string,
  recoveryKey: string
): Promise<CryptoServiceParams> => {
  // It is important, that the password or the passwordCUPKey never leak to our backend.
  // passwordLoginKey is hashed with PBKDF2 without a salt and sent to the backend.
  // passwordCUPKey therefore MUST NOT be ever created without a salt.
  const passwordMaterial = await createKeyMaterial(password);

  // It is not necessary to PBKDF2 the recoveryKey, as it is not an easy target
  // to a dictionary attack, but we do it for conformity.
  const recoveryKeyMaterial = await createKeyMaterial(recoveryKey);

  // Create key pair for sharing the common key.
  const keyPair = await generateAsymKeyPair(keyTypes.USER);
  const { publicKey, privateKey } = keyPair;

  // This is also called the CUP. It is the encrypted private key used to decrypt the common key.
  const encryptedPasswordCUP = await symEncryptObject(passwordMaterial.cupKey, privateKey);
  const encryptedRecoveryCUP = await symEncryptObject(recoveryKeyMaterial.cupKey, privateKey);

  // Create and encrypt the common key, used to encrypt data keys. It is the key that gets shared.
  const rawCommonKey = await generateSymKey(keyTypes.COMMON_KEY);
  const encryptedCommonKey = await asymEncryptString(publicKey, JSON.stringify(rawCommonKey));

  // A key used to encrypt the tags in a deterministic way.
  const rawTagEncryptionKey = await generateSymKey(keyTypes.TAG_ENCRYPTION_KEY, algorithms.AES_CBC);
  const encryptedTagEncryptionKey = await symEncryptObject(rawCommonKey, rawTagEncryptionKey);

  // Make it fit the API.
  return {
    email,
    password_hash: passwordMaterial.loginHash,
    password_key_salt: passwordMaterial.cupSaltAsB64,
    cup: encryptedPasswordCUP,
    public_key: btoa(JSON.stringify(publicKey)),
    tag_encryption_key: encryptedTagEncryptionKey,
    common_key: encryptedCommonKey,
    recovery_password_hash: recoveryKeyMaterial.loginHash,
    recovery_cup: encryptedRecoveryCUP,
    recovery_password_key_salt: recoveryKeyMaterial.cupSaltAsB64,
  };
};

const encryptCUP = async (password: string, decryptedCup: string) => {
  const keyMaterial = await createKeyMaterial(password);
  const newlyEncryptedCup = await symEncryptString(keyMaterial.cupKey, decryptedCup);

  return {
    new_password_hash: keyMaterial.loginHash,
    new_password_key_salt: keyMaterial.cupSaltAsB64,
    new_cup: newlyEncryptedCup,
  };
};

export const createResetPasswordPayload = async (
  recoveryKey: string,
  newPassword: string,
  decryptedCup: string
) => {
  const encryptedCup = await encryptCUP(newPassword, decryptedCup);

  const recoveryKeyAsBytes = convertStringToArrayBufferView(recoveryKey);
  const loginRecoveryHash = await createLoginHashFromBytes(recoveryKeyAsBytes);

  return {
    ...encryptedCup,
    recovery_password_hash: loginRecoveryHash,
  };
};

export const createChangePasswordPayload = async (
  currentPassword: string,
  newPassword: string,
  decryptedCup: string
) => {
  // Check if cup is valid and not tampered.
  // This can be replaced by the api to directly get it from server
  // once it is available.
  if (JSON.parse(decryptedCup).t !== keyTypes.USER.PRIVATE_KEY) {
    throw new Error('Invalid CUP');
  }

  const encryptedCup = await encryptCUP(newPassword, decryptedCup);

  const loginCurrentPasswordHash = await createLoginHash(currentPassword);

  return {
    ...encryptedCup,
    password_hash: loginCurrentPasswordHash,
  };
};

export const decryptCUP = async (password: string, passwordSalt: b64, cup: b64): Promise<b64> => {
  const passwordKeySalt = convertBase64ToArrayBufferView(passwordSalt);
  const passwordBuffer = convertStringToArrayBufferView(password);
  const passwordKey = await deriveKey(passwordBuffer, passwordKeySalt);

  // @ts-ignore
  return await symDecryptString(passwordKey, cup);
};

export const generateAppKeyPair = async () => await generateAsymKeyPair(keyTypes.APP);

export const getEncryptedCommonKeyWithAppPublicKey = async ({
  appPubKey,
  loginResponse,
  password,
}) => {
  // We receive response as snake_case from server.
  const { cup, common_key, password_key_salt } = loginResponse.data;
  // Decryption

  // TODO remove if condition when apps start sending public key
  if (common_key && appPubKey) {
    const decryptedCup = await decryptCUP(password, password_key_salt, cup);
    const decCommonKey = await asymDecryptString(JSON.parse(decryptedCup), common_key);
    return await asymEncryptString(JSON.parse(atob(appPubKey)), decCommonKey);
  }
  return undefined;
};
