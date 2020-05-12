/* eslint-disable no-unused-expressions */
/* eslint-env mocha */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import * as hcRImport from '../../src/lib/d4lRequest';

chai.use(sinonChai);

const { expect } = chai;

describe('d4lRequest', () => {
  const d4lRequest = hcRImport.default;

  const goodResponse = [201, { 'Content-Type': 'application/json' }, '[{ "result": "ok" }]'];

  const badResponse = [
    401,
    {
      'Content-Type': 'application/json',
    },
    '[{ "error": "Your Authorization Token has expired" }]',
  ];

  let server;

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.autoRespondAfter = 0;
  });

  describe('submit', () => {
    it('should pass when api sends successful response', done => {
      server.respondWith('POST', '/path', goodResponse);

      d4lRequest
        .submit('POST', '/path')
        .then(() => {
          expect(server.requests[0].method).to.equal('POST');
          expect(server.requests[0].status).to.equal(201);
          expect(server.requests.length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should pass when api sends successful response with a custom header', done => {
      const responseWithHeader = JSON.parse(JSON.stringify(goodResponse)); // cheap cloneDeep
      responseWithHeader[1]['x-total-count'] = 1;
      server.respondWith('POST', '/path', responseWithHeader);
      d4lRequest
        .submit('POST', '/path', { includeResponseHeaders: true })
        .then(res => {
          expect(res.headers['x-total-count']).to.equal('1');
          expect(server.requests[0].method).to.equal('POST');
          expect(server.requests[0].status).to.equal(201);
          expect(server.requests.length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should throw an error, when 401 unauthorised and requestAcessToken is not set', done => {
      server.respondWith('POST', '/users/fakeUserId/documents/fakeDocumentId', badResponse);

      d4lRequest
        .submit('POST', '/users/fakeUserId/documents/fakeDocumentId', {
          authorize: true,
        })
        .then(done)
        .catch(error => {
          expect(error.status).to.equal(401);
          done();
        })
        .catch(done);
    });

    it('should request new accessToken, when 401 unauthorised and requestAcessToken is set', done => {
      let requestCount = 0;
      server.respondWith(/\/users\/fakeUserId\/documents\/fakeDocumentId/, xhr => {
        requestCount += 1;
        if (requestCount < 2) {
          xhr.respond(...badResponse);
        } else {
          xhr.respond(...goodResponse);
        }
      });
      d4lRequest.requestAccessToken = sinon.stub().returns(Promise.resolve('newAccessToken'));

      d4lRequest
        .submit('POST', '/users/fakeUserId/documents/fakeDocumentId', {
          authorize: true,
        })
        .then(() => {
          expect(server.requests.length).to.equal(2);
          expect(server.requests[0].status).to.equal(401);
          expect(server.requests[1].status).to.equal(201);
          expect(server.requests[1].requestHeaders.authorization).to.equal('Bearer newAccessToken');
          done();
        })
        .catch(done);
    });

    it('returns the Blob from a request with the response type blob', done => {
      const blobResponse = 'blob1234';
      server.respondWith('POST', '/path', blobResponse);

      d4lRequest
        .submit('POST', '/path', {
          responseType: 'blob',
          body: 'requestBody',
        })
        .then(response => {
          expect(response instanceof Blob).to.equal(true);
          done();
        })
        .catch(done);
    });

    it('returns the plain object from a HEAD request with an empty response', done => {
      server.respondWith('HEAD', '/path', '');

      d4lRequest
        .submit('HEAD', '/path')
        .then(response => {
          expect(response).to.equal('');
          done();
        })
        .catch(done);
    });

    it('returns the plain object from a DELETE request with an empty response', done => {
      server.respondWith('DELETE', '/path', '');

      d4lRequest
        .submit('DELETE', '/path')
        .then(response => {
          expect(response).to.equal('');
          done();
        })
        .catch(done);
    });

    it('returns the plain object from a PUT request with an empty response', done => {
      server.respondWith('PUT', '/path', '');

      d4lRequest
        .submit('PUT', '/path')
        .then(response => {
          expect(response).to.equal('');
          done();
        })
        .catch(done);
    });

    it('returns the response as an objects with body and headers when the parameter is set', done => {
      server.respondWith('POST', '/path', goodResponse);

      d4lRequest
        .submit('POST', '/path', {
          includeResponseHeaders: true,
        })
        .then(response => {
          expect(Object.keys(response)).to.contain('body');
          expect(Object.keys(response)).to.contain('headers');
          done();
        })
        .catch(done);
    });
  });

  describe('makeRequest', () => {
    const { makeRequest } = hcRImport;

    it('should default all non-GET request to application/json', done => {
      server.respondWith('POST', '/path', goodResponse);

      makeRequest({
        method: 'POST',
        url: '/path',
      })
        .then(() => {
          const contentType = server.requests[0].requestHeaders['Content-Type'];
          expect(contentType).to.equal('application/json;charset=utf-8');
          done();
        })
        .catch(done);
    });

    it("should not change a given request header's content type to application/json", done => {
      server.respondWith('POST', '/path', goodResponse);

      const customContentType = 'application/octet-stream';

      makeRequest({
        method: 'POST',
        url: '/path',
        headers: {
          'Content-Type': customContentType,
        },
      })
        .then(() => {
          const contentType = server.requests[0].requestHeaders['Content-Type'];
          expect(contentType.indexOf(customContentType)).to.not.equal(-1);
          done();
        })
        .catch(done);
    });

    it("should not change a GET request header's content type to application/json", done => {
      server.respondWith('GET', '/path', goodResponse);

      makeRequest({
        method: 'GET',
        url: '/path',
      })
        .then(() => {
          const contentType = server.requests[0].requestHeaders['Content-Type'];
          expect(contentType).to.not.equal('application/json;charset=utf-8');
          done();
        })
        .catch(done);
    });

    it('should JSON stringify the body of a request', done => {
      server.respondWith('POST', '/path', goodResponse);
      const body = 'iamablobbyblob';

      makeRequest({
        method: 'POST',
        url: '/path',
        body,
      })
        .then(() => {
          expect(server.requests[0].requestBody).to.equal(JSON.stringify(body));
          done();
        })
        .catch(done);
    });

    it('should send a blob without JSON stringification', done => {
      server.respondWith('POST', '/path', goodResponse);
      const blobBody = 'iamablobbyblob';

      makeRequest({
        method: 'POST',
        url: '/path',
        body: blobBody,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })
        .then(() => {
          expect(server.requests[0].requestBody).to.equal(blobBody);
          done();
        })
        .catch(done);
    });
  });

  afterEach(() => {
    server.restore();
  });
});

describe('buildQueryString', () => {
  const { buildQueryString } = hcRImport;
  const sampleUrl = 'https://www.data4life.care';
  const sampleUrlWithString = 'https://www.data4life.care?season=4';
  const queryObject = { disease: 'Lupus', treatmentYear: 2007 };

  it('passes the plain URL when neither params nor query is set', () => {
    expect(buildQueryString(sampleUrl)).to.equal(sampleUrl);
  });

  it('adds params to the URL from the query object', () => {
    expect(buildQueryString(sampleUrl, queryObject)).to.equal(
      `${sampleUrl}?disease=Lupus&treatmentYear=2007`
    );
  });

  it('correctly formats the query with a query-containing base URL when a query object is added', () => {
    expect(buildQueryString(sampleUrlWithString, queryObject)).to.equal(
      `${sampleUrl}?season=4&disease=Lupus&treatmentYear=2007`
    );
  });

  it('correctly formats the query with a query-containing base URL when an emmpty query object is added', () => {
    expect(buildQueryString(sampleUrlWithString, {})).to.equal(`${sampleUrl}?season=4`);
  });
});

describe('convertParamObjectToUrlString', () => {
  const { convertParamObjectToUrlString } = hcRImport;

  const paramsObject = {
    firstName: 'Joe',
    lastName: 'Flynn',
    age: 41,
  };

  it('stringifies an object into a &-joined string', () => {
    expect(convertParamObjectToUrlString(paramsObject)).to.equal(
      'firstName=Joe&lastName=Flynn&age=41'
    );
  });

  it('returns an empty string for an empty object', () => {
    expect(convertParamObjectToUrlString({})).to.equal('');
  });
});
