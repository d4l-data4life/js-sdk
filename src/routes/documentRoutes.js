import config from 'config';
import d4lRequest from '../lib/d4lRequest';

const documentRoutes = {
  createRecord(ownerId, data) {
    return d4lRequest.submit('POST', `${config.userUrl(ownerId)}/records`, {
      body: data,
      authorize: true,
      ownerId,
    });
  },

  updateRecord(ownerId, recordId, data) {
    return d4lRequest.submit('PUT', `${config.userUrl(ownerId)}/records/${recordId}`, {
      body: data,
      authorize: true,
      ownerId,
    });
  },

  searchRecords(ownerId, query) {
    return d4lRequest
      .submit('GET', `${config.userUrl(ownerId)}/records`, {
        query,
        authorize: true,
        includeResponseHeaders: true,
        ownerId,
      })
      .then(({ body, headers }) => ({
        records: body,
        totalCount: headers['x-total-count'],
      }));
  },

  getRecordsCount(ownerId, query) {
    return d4lRequest
      .submit('HEAD', `${config.userUrl(ownerId)}/records`, {
        query,
        authorize: true,
        includeResponseHeaders: true,
        ownerId,
      })
      .then(({ headers }) => ({ totalCount: headers['x-total-count'] }));
  },

  downloadRecord(ownerId, recordId) {
    return d4lRequest.submit('GET', `${config.userUrl(ownerId)}/records/${recordId}`, {
      authorize: true,
      ownerId,
    });
  },

  deleteRecord(ownerId, recordId) {
    return d4lRequest.submit('DELETE', `${config.userUrl(ownerId)}/records/${recordId}`, {
      authorize: true,
      ownerId,
    });
  },

  fetchAttachmentKey(ownerId, recordId) {
    return d4lRequest.submit(
      'GET',
      `${config.userUrl(ownerId)}/records/${recordId}/attachment_key`,
      { authorize: true, ownerId }
    );
  },

  downloadDocument(ownerId, documentId) {
    return d4lRequest.submit('GET', `${config.userUrl(ownerId)}/documents/${documentId}`, {
      authorize: true,
      responseType: 'blob',
    });
  },

  uploadDocument(ownerId, blob) {
    const headers = {
      'Content-Type': 'application/octet-stream',
    };

    return d4lRequest.submit('POST', `${config.userUrl(ownerId)}/documents`, {
      headers,
      body: blob,
      authorize: true,
    });
  },
};

export default documentRoutes;
