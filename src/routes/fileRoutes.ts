import d4lRequest from '../lib/d4lRequest';

const fileRoutes = {
  downloadFile(sasUrl) {
    // @ts-ignore
    return d4lRequest.submit('GET', sasUrl, { responseType: 'blob' });
  },

  uploadFile(sasUrl, blob) {
    const headers = {
      'Content-Type': 'application/octet-stream',
    };
    return d4lRequest.submit('PUT', sasUrl, { headers, body: blob });
  },
};

export default fileRoutes;
