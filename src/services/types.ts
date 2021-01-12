// The exposed search params
export interface Params {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  exclude_tags?: string[];
  exclude_flags?: string[];
  annotations?: string[];
  resourceType?: string;
  partner?: string;
}

export interface QueryParams {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  exclude_tags?: string[];
}

export interface FetchResponse<T extends AppData | Record> {
  totalCount: number;
  records: T[];
}

export interface EncryptedDataKey {
  commonKeyId: string;
  encryptedKey: string;
}

export interface Key {
  t: string;
  v: number;
  sym: string;
}

/** Record */
export interface DecryptedFhirRecord {
  id?: string;
  fhirResource?: fhir.Resource;
  tags?: string[];
  attachmentKey?: EncryptedDataKey;
  customCreationDate?: Date;
  updatedDate?: Date;
  commonKeyId?: string;
}

/** The record we expose to users should not expose any sensitive information.
 * It implies dataKey, attachmentKey, internal tags used to distinguish fhir resource types,
 * client ids. It should only expose annotations created by the users of SDK.
 * Annotations are treated internally as custom tags by the SDK which can be used for filtering
 * by the users of SDK
 */
export interface Record {
  id?: string;
  fhirResource: fhir.Resource;
  annotations?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  partner?: string;
}

/** AppData */
export interface DecryptedAppData {
  id?: string;
  data: any;
  tags?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  commonKeyId?: string;
}

export interface AppData {
  id?: string;
  data: any;
  annotations?: string[];
  customCreationDate?: Date;
  updatedDate?: Date;
  partner?: string;
}
