/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import dateUtils from '../../src/lib/dateUtils';

chai.use(sinonChai);

const { expect } = chai;

describe('date helper', () => {
  it('converts date to yyyy-mm-dd format', done => {
    const date = new Date('2017-04-11');
    const formattedDate = dateUtils.formatDateYyyyMmDd(date);
    expect(formattedDate).to.equal('2017-04-11');
    done();
  });
});
