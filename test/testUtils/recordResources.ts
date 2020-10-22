import testVariables from './testVariables';
import stu3FhirResources from './stu3FhirResources';
import encryptionResources from './encryptionResources';

const recordResources = {
  count: 1,
  documentReference: {
    id: testVariables.recordId,
    date: testVariables.dateString,
    user_id: testVariables.userId,
    version: 2,
    status: 'Active',
    createdAt: testVariables.dateTimeString,
    body: stu3FhirResources.documentReference,
    tags: [testVariables.tag, testVariables.secondTag, testVariables.customTag],
  },
  documentReferenceEncrypted: {
    record_id: testVariables.recordId,
    date: testVariables.dateString,
    user_id: testVariables.userId,
    common_key_id: testVariables.commonKeyId,
    version: 2,
    status: 'Active',
    createdAt: testVariables.dateTimeString,
    encrypted_body: stu3FhirResources.encryptedFhir,
    encrypted_tags: [testVariables.encryptedTag],
    encrypted_key: encryptionResources.encryptedDataKey,
  },
};

export default recordResources;
