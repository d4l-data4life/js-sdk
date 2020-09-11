/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import BlobFile from '../../src/lib/BlobFile';

chai.use(sinonChai);

const { expect } = chai;

describe('BlobFile', () => {
  it('should construct a BlobFile', () => {
    const lastModified = 1;
    // eslint-disable-next-line no-restricted-globals
    // @ts-ignore
    const blobFile = new BlobFile(['data'], name, { lastModified });
    // eslint-disable-next-line no-restricted-globals
    const file = new File(['data'], name, { lastModified });
    expect(blobFile.lastModified).to.equal(file.lastModified);
    // @ts-ignore
    expect(blobFile.lastModifiedDate).to.deep.equal(file.lastModifiedDate);
    expect(blobFile.name).to.equal(file.name);
  });
});
