import testVariables from './testVariables';

const clientID = '1123581321';
const granteeID = '31415926';
const symKey = {
  alg: 'A256CBC',
  ext: true,
  k: 'quGuIIdEdy_S1Cd1Wy2eEsHSL_dfpkwcKssH9k6fPtY',
  key_ops: ['encrypt', 'decrypt'],
  kty: 'oct',
};

const PKCS8Key =
  'MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCjkChc6JDFN+vGYOFZ7ERYdh3wKculvC9sec7jlqgEIJmsJ9ds694fJ0XEBDE4ntcbIvYAOszTg/mV4c/h0yw91yRyMKUbO8EeOv09mvOFd21UzeITjK5AcKBIqGOa2BMCE5Z/Fnh5pzx8a9eaMYlueB2TVFzYOgrG7J4J0QvCZqnpKBpjoDByBrGFRYU3ZlVovBRB9UgqMrrNjSxib1F2Q44gKXx3pdfGzO7C8XbPcikal7vOuJwOA8ErnBlwmqSif7cB6OCM9D2ACjLMCGxfSuhxNr+bOSMZZe1aqLh7fZTgAnapIcotB92FVdhQ6hX7yPnKU9NQSnufOJoNOnv1AgMBAAECggEABsAkN6gY6C2FgMkD0/3Gg64lpdaxGH8v/TajyCHc1QVxbOOyEO/v2XJPVKaQT37CxanHjxKI3Jv1o5l6cR68PzXPbm+9M2a1HZB1XjhfH52NDh3MhwkHMhKpPYZxofTpXUG+CYhoYtZOTpuhfjQthg6ADfzCiOFltiMS52MmLJjrik1gKlsbZ3nBq57atf8j6v55mfplVUhEszMaMqG8P9JWhHOUASuWu+xUXyOakO/P7sqrKdSC8vssWcZ83pP7guXOyo8QmEvaKUZeFEp7EbJcZJS9bqtYgZGqJBthlMJgkproLDHJy8J0u9HdwnHcTVSGLL6NDFP3+A0Qnq53ewKBgQDX8t3zL000K39Ytpq0Mu26aJp+stQQPO/0IqVfJN/nUSoVOTt2qrBM0dGZdGfjf9tT0xU8VqKsS+gTq8e1iRiGD0Yp4AN38uSDdi8dba83y9NuskwgkqNk7k3UiYjB/koHW8WBWv9pE8yHDddIsy7k1Bfm2SWAOw67tLXuuCM47wKBgQDB5gzXfbYuRaFQML/DzAd7E5dIUS9CdoC5Ht1ieV3c/eBigb6sLfIxIymmZ7Ma9yeS9GK/p5C6cSixDavKGW6VHTAFhKgMTdxy3nFAjyXzzle+v2ypqH5ZTNnAyWi+PZqG8Lw21mldPsAoTRFpXaEP8rDiXRY9vHBMDW5uNyixWwKBgGB0Ad6Uyg77Pq4JIaBK/xO7lQXyKfX2wdZxgxu0BK30+q7wGTcvlf852DyKWbyrZvNR3LJOn+oFHWtr1o+m5GU8fUJG5EW3H4n4R6MFUrXBPHa8/HOwC3sRVYIQzByZz8bpnpXgZyQvy7Km4/l8zv02HlbltnJH7pS4amptpI3RAoGAVcgzMjrZmIsRnOqUTEk9ngPC0CmqoNrQhBXVl7VeA2EGHk6MTpxdI8QMryP9pxZlGayo62V0sCdT+1CzCcxKkgnBrw9LUXY461DiBc/O2JgXVbpWlpCGpXdMdvAkONYEQWLLwe8F2kzisnG2HElh8i5Kdzr7lgCCJgNjMbuRczUCgYAcJz/5hFRSRyKdJkyP43ZZK6wNSfQlG+7Qq5x5n43UMmR1gylDw0J+zh2/JmZCcrqhXoPVTaN+CtRvCnNT5GnMj+aCQbod67xHf3bLnCZlyHWJtZwUkNuEICurMHvbXyxJFZc33VeXoC3msfh8WHLw2hMs5LXDWe/UvafB3o4ecA==';
const CUPPrivateKey = {
  t: 'upriv',
  priv: PKCS8Key,
  v: 1,
};
const SPKIKey =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo5AoXOiQxTfrxmDhWexEWHYd8CnLpbwvbHnO45aoBCCZrCfXbOveHydFxAQxOJ7XGyL2ADrM04P5leHP4dMsPdckcjClGzvBHjr9PZrzhXdtVM3iE4yuQHCgSKhjmtgTAhOWfxZ4eac8fGvXmjGJbngdk1Rc2DoKxuyeCdELwmap6SgaY6AwcgaxhUWFN2ZVaLwUQfVIKjK6zY0sYm9RdkOOICl8d6XXxszuwvF2z3IpGpe7zricDgPBK5wZcJqkon+3AejgjPQ9gAoyzAhsX0rocTa/mzkjGWXtWqi4e32U4AJ2qSHKLQfdhVXYUOoV+8j5ylPTUEp7nziaDTp79QIDAQAB';
const CUPPublicKey = {
  t: 'upub',
  v: 1,
  pub: SPKIKey,
};
const rawSymKey = '30iAFtkLLRFjuZKPvX6JOAwZaQbt+WlGusZfcNAWnXQ=';
const symHCKey = {
  t: 'dk',
  v: 1,
  sym: rawSymKey,
};
const tagEncryptionKey = {
  t: 'tek',
  v: 1,
  sym: '4/wwoE26eIRuGZgowe/TzSMbuGjY3AXoIsgU9raUF0g=',
};
const testString = 'Hęłlø črüėl wōrlđ';
const dataKey = symKey;
const encryptedDataKey = 'encrypted_data_key';
const attachmentKey = symKey;
const encryptedAttachmentKey = 'encrypted_attachment_key';
const encryptedTagEncryptionKey =
  'tYML9tI22Tv2ZjydEE0rZs1xFMKukjoozP8h33e0jq5Lp+YRfwfKhrZpbTnsSxe85OXp+IqBJqjxo0p5+tePolN9KdxGe5BJM+DUyPMZYJhEbXyt2ZA2wo5VxUMnG0okaus=';
const data = new Uint8Array([1, 2, 3, 4, 5, 6]);
const encryptedData = 'encryptedData';
const string = 'string';
const encryptedString = 'encrypted_string';
const object = {};
const encryptedObject = 'encrypted_object';
const commonKey = {
  t: 'ck',
  v: 1,
  sym: 'Zodqw5UFGP2iFpznW0+HNCaol+9qKjfz8T3YbJts7J0=',
};
// encrypted with CUPPublicKey
const encryptedCommonKey =
  'WbDh/dyA0TSMa/xvT+SEy17OmBphPkv/lursGK7QVAIKoLuHzF1QEIzlT0DIzQ/YxsYT+DIt0GdNFGZDDYxvJ9Q3kgLY8zs0/W525teQo9KsfEyzH0km/8JWXydB1h3MclHtzLVFLxr6gOvFIHtX4uJVbhsVYNOQeWANno4TUMJ7smKEXUy6WNaSx/aavqEdR6Tki0eUTG5dSXKEzi4lV2vdCa8ROKQxCIzdLhhOUqiFyMnuDRTF4Gkaom2olZrxsmPyXuhXs4NMilvQs8Jds0evEHvgiYFvyPPuzMbOwQ8Yttjw+XnxQMY2pMaEDASNY96T8TJkw3yVvLA1j9n/8g==';

const permissionResponse = {
  app_id: testVariables.appId,
  common_key: btoa(JSON.stringify(commonKey)),
  grantee: testVariables.userId,
  grantee_public_key: btoa(JSON.stringify(CUPPublicKey)),
  id: testVariables,
  owner: testVariables.userId,
  scope: 'exc perm:r perm:w rec:r rec:w attachment:r attachment:w user:r user:w user:q',
};

export default {
  clientID,
  granteeID,
  commonKey,
  dataKey,
  encryptedDataKey,
  attachmentKey,
  encryptedAttachmentKey,
  tagEncryptionKey,
  encryptedTagEncryptionKey,
  encryptedCommonKey,
  data,
  encryptedData,
  string,
  testString,
  encryptedString,
  object,
  encryptedObject,
  symHCKey,
  rawSymKey,
  permissionResponse,
  SPKIKey,
  CUPPublicKey,
  PKCS8Key,
  CUPPrivateKey,
};
