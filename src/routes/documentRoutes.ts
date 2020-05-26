// tslint:disable-next-line:import-name
import config from '../config/index';
import d4lRequest from '../lib/d4lRequest';

const documentRoutes = {
  createRecord(ownerId, data) {
    return d4lRequest.submit('POST', `${config.userUrl(ownerId)}/records`, {
      ownerId,
      body: data,
      authorize: true,
    });
  },

  updateRecord(ownerId, recordId, data) {
    return d4lRequest.submit('PUT', `${config.userUrl(ownerId)}/records/${recordId}`, {
      ownerId,
      body: data,
      authorize: true,
    });
  },

  searchRecords(ownerId, query) {
    return d4lRequest
      .submit('GET', `${config.userUrl(ownerId)}/records`, {
        ownerId,
        query,
        authorize: true,
        includeResponseHeaders: true,
      })
      .then(({ body, headers }) => ({
        records: body,
        totalCount: headers['x-total-count'],
      }));
  },

  getRecordsCount(ownerId, query) {
    return d4lRequest
      .submit('HEAD', `${config.userUrl(ownerId)}/records`, {
        ownerId,
        query,
        authorize: true,
        includeResponseHeaders: true,
      })
      .then(({ headers }) => ({ totalCount: headers['x-total-count'] }));
  },

  downloadRecord(ownerId, recordId) {
    return d4lRequest.submit('GET', `${config.userUrl(ownerId)}/records/${recordId}`, {
      ownerId,
      authorize: true,
    });
  },

  deleteRecord(ownerId, recordId) {
    return d4lRequest.submit('DELETE', `${config.userUrl(ownerId)}/records/${recordId}`, {
      ownerId,
      authorize: true,
    });
  },

  fetchAttachmentKey(ownerId, recordId) {
    return d4lRequest.submit(
      'GET',
      `${config.userUrl(ownerId)}/records/${recordId}/attachment_key`,
      { ownerId, authorize: true }
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
