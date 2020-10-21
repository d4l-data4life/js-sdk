const testVariables = {
  userId: 'user_id',
  privateKey: 'private_key',
  commonKey: {
    t: 'ck',
    v: 1,
    sym: 'ekoomVklw+go3Xg/vPuK7lJYDSAu97UohSAdZXi/22Y=',
  },
  commonKeyId: 'common_key_id',
  alternativeCommonKeyId: 'alt_common_key_id',
  clientId: 'partner_id#client',
  partnerId: 'partner_id',
  clientSecret: 'client_secret',
  wrongClientSecret: 'wrong_client_secret',
  secondUserId: 'second_user_id',
  documentId: 'document_id',
  recordId: 'record_id',
  fileId: 'file_id',
  tresorId: 'tresor_id',
  sessionId: 'session_id',
  regValidationVerifier: 'reg_validation_verifier',
  operationId: 'operation_id',
  userAlias: 'user@alias.de',
  password: 'password',
  wrongPassword: 'wrong_password',
  dateString: '2017-12-15',
  dateTimeString: '2017-12-15T10:35:52Z',
  tag: 'resourcetype=documentreference',
  // encrypted with encryptionResources.tagEncryptionKey
  encryptedTag: 'oEYB2yHZ26/+mdqTDOIjQnwU7cl49Ldf3HjATcNofnk=',

  secondTag: 'partner=1',
  // encrypted with encryptionResources.tagEncryptionKey
  encryptedSecondTag: 'Qg6IQzTvmxuYfE9PyqU7zg==',

  updatedByPartnerTag: 'updatedbypartner=2',
  encodedTag: 'client=ann%5Fotation',
  customTag: 'custom=annotation',

  appDataFlag: 'flag=appdata',
  // encrypted with encryptionResources.tagEncryptionKey
  encryptedAppDataFlag: 'ktpQgkX9xenHcax0IhbvAQ==',

  encryptedUserData: 'encrypted_user_data',
  string: 'string',
  encryptedString: 'encrypted_string',
  state: 'state',
  userData: {},
  refreshToken: 'refresh_token',
  appId: 'app_id',
  annotation: 'annotation',
  invalidAnnotation:
    'khjghghghdgjfhdsgfhdgsfjsfsfgdufsdyfyyujjtgfyyyyfyuyyyryrygugydrdfgugrssfdcbterwddzczxczcxk' +
    'khjghghghdgjfhdsgfhdgsfjsfsfgdufsdyfyyujjtgfyyyyfyuyyyryrygugydrdfgugrssfdcbterwddzczxczcxkigyfjhfdsfsdfsdfsd' +
    'khjghghghdgjfhdsgfhdgsfjsfsfgdufsdyfyyujjtgfyyyyfyuyyyryrygug',
  dataModelVersion: 99,
};

export default testVariables;
