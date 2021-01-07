import {
  symDecryptObject,
  generateSymKey,
  keyTypes,
  symEncryptObject,
  symEncryptBlob,
  symEncryptString,
  symDecrypt,
  // @ts-ignore
} from 'js-crypto';
import { EncryptedDataKey, Key } from './types';
import userService from './userService';

type EncryptedKeyOrEncryptedKeyPromise = EncryptedDataKey | Promise<EncryptedDataKey>;

// creates an object containing utility methods for the crypto service scoped to the specified user
const createCryptoUtils = (userId: string) => {
  const decryptDataKey = async (dataKeyInfo: EncryptedDataKey): Promise<Key> => {
    const { commonKeyId, encryptedKey } = dataKeyInfo;
    const commonKey = await userService.getCommonKey(userId, commonKeyId);
    return symDecryptObject(commonKey, encryptedKey);
  };

  // encrypts one or multiple data keys
  // the resulting keys will always be encrypted with the same common key
  const encryptDataKeys = async (...decryptedDataKeys: Key[]) => {
    const { commonKey, commonKeyId } = await userService.getUser(userId);
    return Promise.all(
      decryptedDataKeys.map(async decryptedKey => {
        const encryptedKey = await symEncryptObject(commonKey, decryptedKey);
        return { commonKeyId, encryptedKey };
      })
    );
  };

  // this method does two things:
  // - if passed an encrypted data key object, it decrypts it
  // - if passed undefined, it creates a new data key
  // in both cases it returns the key in both encrypted and unencrypted form
  const parseOrPopulateDataKey = async (
    maybeEncryptedDataKeyPromise?: EncryptedKeyOrEncryptedKeyPromise
  ) => {
    const maybeEncryptedDataKey = await maybeEncryptedDataKeyPromise;
    if (maybeEncryptedDataKey) {
      const decryptedKey = await decryptDataKey(maybeEncryptedDataKey);
      return { decryptedKey, encryptedDataKey: maybeEncryptedDataKey };
    }
    const decryptedKey = await generateSymKey(keyTypes.DATA_KEY);
    const [encryptedDataKey] = await encryptDataKeys(decryptedKey);
    return { encryptedDataKey, decryptedKey };
  };

  return {
    decryptDataKey,
    encryptDataKeys,
    parseOrPopulateDataKey,
  };
};

const createCryptoService = (userId: string) => {
  const { decryptDataKey, encryptDataKeys, parseOrPopulateDataKey } = createCryptoUtils(userId);

  const encryptString = async (
    data: string,
    maybeEncryptedKeyPromise?: EncryptedKeyOrEncryptedKeyPromise
  ) => {
    const { encryptedDataKey, decryptedKey } = await parseOrPopulateDataKey(
      maybeEncryptedKeyPromise
    );
    const result = await symEncryptString(decryptedKey, data);
    return [result, encryptedDataKey];
  };

  const encryptBlobs = async (
    blobArray: Blob[],
    maybeEncryptedKeyPromise?: EncryptedKeyOrEncryptedKeyPromise
  ) => {
    const { encryptedDataKey, decryptedKey } = await parseOrPopulateDataKey(
      maybeEncryptedKeyPromise
    );
    const result = await Promise.all(blobArray.map(blob => symEncryptBlob(decryptedKey, blob)));

    return [result, encryptedDataKey];
  };

  const encryptObject = async (
    json: Record<string, any>,
    maybeEncryptedKeyPromise?: EncryptedKeyOrEncryptedKeyPromise
  ) => {
    const { encryptedDataKey, decryptedKey } = await parseOrPopulateDataKey(
      maybeEncryptedKeyPromise
    );

    const result = await symEncryptObject(decryptedKey, json);

    return [result, encryptedDataKey];
  };

  const decryptData = async (encryptedKeyInfo: EncryptedDataKey, encryptedData: Uint8Array) => {
    const decryptedDataKey = await decryptDataKey(encryptedKeyInfo);

    return symDecrypt(decryptedDataKey, encryptedData);
  };

  const updateKeys = async (...encryptedKeyInfos: EncryptedDataKey[]) => {
    const currentCommonKeyId = (await userService.getUser(userId)).commonKeyId;

    if (encryptedKeyInfos.every(keyInfo => keyInfo.commonKeyId === currentCommonKeyId)) {
      // no update necessary, all keys are up-to-date
      return encryptedKeyInfos;
    }

    const decryptedKeys = await Promise.all(encryptedKeyInfos.map(decryptDataKey));
    const encryptedKeys = await encryptDataKeys(...decryptedKeys);

    return encryptedKeys;
  };

  return {
    encryptString,
    encryptBlobs,
    encryptObject,
    decryptData,
    updateKeys,
  };
};

export default createCryptoService;
