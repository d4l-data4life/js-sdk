/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import authRoutes from '../../src/routes/authRoutes';
import testVariables from '../testUtils/testVariables';
import d4lRequest from '../../src/lib/d4lRequest';

chai.use(sinonChai);

const { expect } = chai;

describe('authRoutes', () => {
  let server;

  const goodResponse = [201, { 'Content-Type': 'application/json' }, '[{ "result": "ok" }]'];

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.autoRespondAfter = 0;
  });

  describe('fetchAccessToken', () => {
    it('sends the correct query information', done => {
      server.respondWith('POST', /oauth\/token/, goodResponse);

      d4lRequest
        .submit(...authRoutes.fetchAccessToken(testVariables.userId))
        .then(() => {
          expect(server.requests[0].method).to.equal('POST');
          expect(server.requests[0].status).to.equal(201);
          expect(server.requests[0].url).to.contain(
            '?grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&owner=user_id'
          );
          expect(server.requests.length).to.equal(1);
          done();
        })
        .catch(done);
    });
  });

  afterEach(() => {
    server.restore();
  });
});
