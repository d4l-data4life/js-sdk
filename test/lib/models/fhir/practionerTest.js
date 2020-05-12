/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import Practitioner from '../../../../src/lib/models/fhir/Practitioner';
import practionerResource from '../../../testUtils/fhirPractitionerResource';

chai.use(sinonChai);

const { expect } = chai;

describe('models/FHIR/Practioner', () => {
  it('should be possible to create a practioner object with constructor parameters', () => {
    const practioner = new Practitioner({
      firstName: 'Shawn',
      lastName: 'Murphy',
      prefix: 'Dr.',
      suffix: 'Jr.',
      street: 'Liverpool str.',
      city: 'London',
      postalCode: '20439',
      telephone: '915023421456',
      website: 'www.example.com',
    });
    expect(practioner.getFirstName()).to.equal('Shawn');
    expect(practioner.getLastName()).to.equal('Murphy');
    expect(practioner.getPrefix()).to.equal('Dr.');
    expect(practioner.getSuffix()).to.equal('Jr.');
    expect(practioner.getCity()).to.equal('London');
    expect(practioner.getStreet()).to.equal('Liverpool str.');
    expect(practioner.getPostalCode()).to.equal('20439');
    expect(practioner.getTelephone()).to.equal('915023421456');
    expect(practioner.getWebsite()).to.equal('www.example.com');
  });

  it('should be possible to create a practitioner object with limitedconstructor parameters', () => {
    const practioner = new Practitioner({});
    expect(practioner.getFirstName()).to.equal(undefined);
    expect(practioner.getLastName()).to.equal(undefined);
    expect(practioner.getPrefix()).to.equal(undefined);
    expect(practioner.getSuffix()).to.equal(undefined);
    expect(practioner.getCity()).to.equal(undefined);
    expect(practioner.getStreet()).to.equal(undefined);
    expect(practioner.getCity()).to.equal(undefined);
    expect(practioner.getPostalCode()).to.equal(undefined);
    expect(practioner.getTelephone()).to.equal(undefined);
    expect(practioner.getWebsite()).to.equal(undefined);
  });
  it('should return valid Practitioner instance with fromFHIRObject', () => {
    const practioner = Practitioner.fromFHIRObject(practionerResource);
    expect(practioner.getCity()).to.equal('PleasantVille');
    expect(practioner.getStreet()).to.equal('534 Erewhon St');
    expect(practioner.getPostalCode()).to.equal('3999');
    expect(practioner.getPrefix()).to.equal('Dr');
    expect(practioner.getFirstName()).to.equal('Adam');
    expect(practioner.getLastName()).to.equal('Careful');
    expect(practioner.getSuffix()).to.equal(undefined);
    expect(practioner.getWebsite()).to.equal(undefined);
  });
  it('should throw error when fromFHIRObject is called with  with no arguments', done => {
    try {
      Practitioner.fromFHIRObject();
    } catch (err) {
      expect(err.message).to.equal('require 1 argument of type fhir Practitioner');
      done();
    }
  });
});
