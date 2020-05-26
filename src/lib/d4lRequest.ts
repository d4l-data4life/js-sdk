import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import { throttle } from './requestUtils';
import authRoutes from '../routes/authRoutes';

const MAX_RETRIES = 2;
const CONTENT_TYPE = 'Content-Type';

const isExpired = error => error.status === 401;

export const convertParamObjectToUrlString = paramObject =>
  Object.keys(paramObject)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramObject[key])}`)
    .join('&');

export const buildQueryString = (url, query = null) => {
  if (query && isObject(query)) {
    const paramString = convertParamObjectToUrlString(query);
    if (paramString.length > 0) {
      // in case the root URL already has params attached
      const paramSeparator = url.includes('?') ? '&' : '?';
      return `${url}${paramSeparator}${paramString}`;
    }
  }

  return url;
};

export function makeRequest(options): Promise<any> {
  const request = () =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = buildQueryString(options.url, options.query);

      xhr.open(options.method, url);
      xhr.onload = function onLoad() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            body: xhr.response,
            headers: xhr.getAllResponseHeaders(),
          });
        } else {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };

      xhr.onerror = function onError() {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };

      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          if (options.headers[key] !== null) {
            xhr.setRequestHeader(key, options.headers[key]);
          }
        });
      }

      if (options.method !== 'GET' && (!options.headers || !options.headers[CONTENT_TYPE])) {
        xhr.setRequestHeader(CONTENT_TYPE, 'application/json');
      }

      if (options.responseType && isString(options.responseType)) {
        xhr.responseType = options.responseType;
      }

      if (options.body && (options.body.length || Object.keys(options.body).length > 0)) {
        if (options.headers && options.headers[CONTENT_TYPE] === 'application/octet-stream') {
          xhr.send(options.body);
        } else {
          xhr.send(JSON.stringify(options.body));
        }
      } else {
        xhr.send();
      }
    });

  return throttle().then(request);
}

const d4lRequest = {
  currentUserId: null,
  currentUserLanguage: null,
  // the accessToken of the logged in user, which is used for getting other users tokens
  masterAccessToken: null,
  accessTokens: {},

  /**
   * @returns {Promise<String>} resolves to the accessToken of the logged in user
   */
  requestAccessToken: null,

  reset() {
    this.currentUserId = null;
    this.currentUserLanguage = null;
    this.masterAccessToken = null;
    this.accessTokens = {};
  },

  setMasterAccessToken(accessToken) {
    this.masterAccessToken = `Bearer ${accessToken}`;
  },

  setAccessToken(userId, accessToken) {
    this.accessTokens[userId] = `Bearer ${accessToken}`;
  },

  /**
   * returns the accessToken if known or fetches it for the given ownerId and stores it.
   *
   * @param {String} ownerId=null - accessToken's ownerId, logged in user's by default
   * @returns {Promise<String>} the accessToken of the requested owner
   */
  getAccessToken(ownerId) {
    // getAccessToken for current user's access token
    if (!ownerId || ownerId === this.currentUserId) {
      return Promise.resolve(this.masterAccessToken);
    }
    // getAccessToken for other user's access token
    if (this.accessTokens[ownerId]) {
      return Promise.resolve(this.accessTokens[ownerId]);
    }

    // fetch for accessToken for the given user
    return this.submit(...authRoutes.fetchAccessToken(ownerId)).then(response => {
      this.setAccessToken(ownerId, response.access_token);
      return this.accessTokens[ownerId];
    });
  },

  submit(
    type,
    path,
    {
      body = {},
      headers = {},
      responseType = '',
      authorize = false,
      ownerId = null,
      query = null,
      includeResponseHeaders = false,
    } = {}
  ) {
    let retries = 0;

    // noop promise if authorize is not set
    const accessTokenPromise = authorize ? this.getAccessToken(ownerId) : Promise.resolve(null);

    const httpHeaders = { ...headers };

    /*

        The following code is disabled because of temporary cors issues.
        This needs more refinement on the back-end, or we'll need to send
        these headers more explicitly for specific endpoints only.
        See also https://gesundheitscloud.atlassian.net/browse/CIT-1340

        if (this.currentUserLanguage) {
            httpHeaders['X-User-Language'] = this.currentUserLanguage;
        }

        const isD4LPath = path.startsWith(config.environmentConfig.api);
        if (isD4LPath) {
            httpHeaders['GC-SDK-Version'] = `JS ${version}`;
        }
        */

    const submitRequest = accessToken =>
      makeRequest({
        responseType,
        body,
        query,
        method: type,
        url: path,
        headers: {
          ...httpHeaders,
          authorization: accessToken,
        },
      })
        .then(response => {
          const returnBodyText =
            responseType === 'blob' ||
            ((type === 'PUT' || type === 'HEAD' || type === 'DELETE') &&
              response.body.length === 0);
          const responseBody = returnBodyText ? response.body : JSON.parse(response.body);

          if (includeResponseHeaders) {
            // http headers have CRLF line breaks, see https://stackoverflow.com/a/5757349
            const headerLines = response.headers.split('\r\n');
            const responseHeaders = headerLines.reduce((accumulator, current) => {
              const [key, value] = current.split(': ');
              return {
                ...accumulator,
                [key]: value,
              };
            }, {});
            return {
              body: responseBody,
              headers: responseHeaders,
            };
          }

          return responseBody;
        })
        .catch(err => {
          if (isExpired(err) && this.requestAccessToken && retries < MAX_RETRIES) {
            retries += 1;
            let refreshPromise;
            if (ownerId && ownerId !== this.currentUserId) {
              // invalidate user's access token and get a new one
              this.accessTokens[ownerId] = null;
              refreshPromise = this.getAccessToken(ownerId);
            } else {
              // request accessToken for the logged in user's accessToken and set it
              refreshPromise = this.requestAccessToken()
                .then(this.setMasterAccessToken.bind(this))
                .then(this.getAccessToken.bind(this));
            }

            return refreshPromise.then(token => submitRequest(token));
          }
          throw err;
        });

    return accessTokenPromise.then(submitRequest);
  },
};

export default d4lRequest;
