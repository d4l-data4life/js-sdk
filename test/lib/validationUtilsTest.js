/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import {
  isDateIfExists,
  isStringIfExists,
  isObjectIfExists,
  isBlobIfExists,
  ensureArrayIfExists,
  ensureDateIfExists,
  validateEmail,
} from '../../src/lib/validationUtils';

chai.use(sinonChai);

const { expect } = chai;

describe('validationUtils', () => {
  it('should validate email', () =>
    [
      {
        data: 'email@domain.com',
        expectedResult: true,
      },
      {
        data: 'firstname.lastname@domain.com',
        expectedResult: true,
      },
      {
        data: 'email@subdomain.domain.com',
        expectedResult: true,
      },
      {
        data: 'firstname+lastname@domain.com',
        expectedResult: true,
      },
      /* { // This is actually a valid email address
        data: 'email@123.123.123.123',
        expectedResult: true,
    }, */ {
        data: '1234567890@domain.com',
        expectedResult: true,
      },
      {
        data: 'email@domain-one.com',
        expectedResult: true,
      },
      {
        data: 'Dänaßäna@gmail.com',
        expectedResult: true,
      },
      {
        data: 'あいうえお@domain.com',
        expectedResult: true,
      },
      {
        data: 'email@domain.co.jp',
        expectedResult: true,
      },
      {
        data: 'firstname-lastname@domain.com',
        expectedResult: true,
      },
      {
        data: '_______@domain.com',
        expectedResult: true,
      },
      {
        data: 'plainaddress',
        expectedResult: false,
      },
      {
        data: '#@%^%#$@#$@#.com',
        expectedResult: false,
      },
      {
        data: 'Joe Smith <email@domain.com>',
        expectedResult: false,
      },
      {
        data: 'email.domain.com',
        expectedResult: false,
      },
      {
        data: 'email@domain@domain.com',
        expectedResult: false,
      },
      {
        data: '.email@domain.com',
        expectedResult: false,
      },
      {
        data: 'email.@domain.com',
        expectedResult: false,
      },
      {
        data: 'email..email@domain.com',
        expectedResult: false,
      },
      {
        data: 'email@domain.com (Joe Smith)',
        expectedResult: false,
      },
      {
        data: 'email@domain',
        expectedResult: false,
      },
      {
        data: 'email@-domain.com',
        expectedResult: false,
      },
      {
        data: 'email@111.222.333.44444',
        expectedResult: false,
      },
      {
        data: 'email@domain..com',
        expectedResult: false,
      },
    ].forEach(({ data, expectedResult }) => {
      // eslint-disable-next-line
      it(`should validate email "${data}" as ${expectedResult}`, done => {
        const isValid = validateEmail(data);
        expect(isValid).to.equal(expectedResult);
        done();
      });
    }));

  it('should ignore array validation when is undefined', () => {
    expect(ensureArrayIfExists(undefined)).to.equal(undefined);
  });

  it('should validate a nonexistent value in isStringIfExists', () => {
    expect(isStringIfExists(null)).to.equal(true);
  });

  it('should validate a string value in isStringIfExists', () => {
    expect(isStringIfExists('boo')).to.equal(true);
  });
  it('should not validate a number value in isStringIfExists', () => {
    expect(isStringIfExists(42)).to.equal(false);
  });

  it('should validate a nonexistent value in isDateIfExists', () => {
    expect(isDateIfExists(null)).to.equal(true);
  });

  it('should validate a Date value in isDateIfExists', () => {
    expect(isDateIfExists(new Date('2011-01-01'))).to.equal(true);
  });

  it('should not validate a numeric value in isDateIfExists', () => {
    expect(isDateIfExists(42)).to.equal(false);
  });

  it('should validate a nonexistent value in isObjectIfExists', () => {
    expect(isObjectIfExists(null)).to.equal(true);
  });

  it('should validate an object in isObjectIfExists', () => {
    expect(isObjectIfExists({ key: 'value' })).to.equal(true);
  });

  it('should not validate a string in isObjectIfExists', () => {
    expect(isObjectIfExists('dancing queen')).to.equal(false);
  });

  it('should validate a nonexistent value in isBlobIfExists', () => {
    expect(isBlobIfExists(null)).to.equal(true);
  });

  it('should validate a blob value in isBlobIfExists', () => {
    const bobLowLaw = new Blob();
    expect(isBlobIfExists(bobLowLaw)).to.equal(true);
  });

  it('should not validate a string in isBlobIfExists', () => {
    expect(isBlobIfExists('dancing queen')).to.equal(false);
  });

  it('should validate array when is array', () => {
    const arr = [];
    expect(ensureArrayIfExists(arr)).to.equal(arr);
  });

  it('should throw when not array', () => {
    const arr = {};
    expect(() => ensureArrayIfExists(arr)).to.throw();
  });

  it('should ignore date validation when is undefined', () => {
    expect(ensureDateIfExists(undefined)).to.equal(undefined);
  });

  it('should validate date when is date', () => {
    const date = new Date();
    expect(ensureDateIfExists(date)).to.equal(date);
  });

  it('should throw when not date', () => {
    const date = 1;
    expect(() => ensureDateIfExists(date)).to.throw();
  });
});
