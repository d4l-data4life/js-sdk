/* eslint-disable max-nested-callbacks */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import { isAllowedFileType, isWithinSizeLimit } from '../../../src/lib/fileValidator';

chai.use(sinonChai);

const { expect } = chai;

describe('fileValidator', () => {
  it('should pass validation for png file', done => {
    fetch('/fileSamples/sample.png')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for jpg file', done => {
    fetch('/fileSamples/sample.jpg')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for jpg/jfif file', done => {
    fetch('/fileSamples/sample.jfif')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for jpg/jfif file', done => {
    fetch('/fileSamples/sample-jfif.jpg')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for Canon jpg file', done => {
    fetch('/fileSamples/sample-canon-format.jpg')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for generic jpg data', done => {
    Promise.resolve(new Uint8Array([0xff, 0xd8, 0xff, 0xdb]))
      .then(res => new Blob([res.buffer], { type: 'octet/stream' }))
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for samsung jpg data', done => {
    Promise.resolve(new Uint8Array([0xff, 0xd8, 0xff, 0xe3]))
      .then(res => new Blob([res.buffer], { type: 'octet/stream' }))
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for jpg/spiff data', done => {
    Promise.resolve(new Uint8Array([0xff, 0xd8, 0xff, 0xe8]))
      .then(res => new Blob([res.buffer], { type: 'octet/stream' }))
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for dcm file', done => {
    fetch('/fileSamples/sample.dcm')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for tiff file (big endian)', done => {
    fetch('/fileSamples/sample-big-endian.tiff')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for tiff file (little endian)', done => {
    fetch('/fileSamples/sample-little-endian.tiff')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should pass validation for pdf file', done => {
    fetch('/fileSamples/sample.pdf')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .then(res => {
        expect(res).to.equal(true);
        done();
      })
      .catch(done);
  });
  it('should fail validation for bmp file', done => {
    fetch('/fileSamples/sample.bmp')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .catch(err => {
        expect(err.message).to.equal(
          'Unsupported file type. Permitted file types are jpg, png, tiff, pdf and dcm.'
        );
        done();
      });
  });
  it('should fail validation if extension is png but content is bmp format', done => {
    fetch('/fileSamples/invalidSample.png')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .catch(err => {
        expect(err.message).to.equal(
          'Unsupported file type. Permitted file types are jpg, png, tiff, pdf and dcm.'
        );
        done();
      });
  });
  it('should fail validation for html file having script inside it', done => {
    fetch('/fileSamples/invalidSample.html')
      .then(res => res.blob())
      .then(isAllowedFileType)
      .catch(err => {
        expect(err.message).to.equal(
          'Unsupported file type. Permitted file types are jpg, png, tiff, pdf and dcm.'
        );
        done();
      });
  });

  describe('isWithinFileSizeLimit', () => {
    it('should return true for a file within the limit', done => {
      fetch('/fileSamples/invalidSample.png')
        .then(res => res.blob())
        .then(resultFile => {
          // eslint-disable-next-line no-unused-expressions
          expect(isWithinSizeLimit(resultFile)).to.equal(true);
          done();
        });
    });

    it('should return false for a file outside the limit', done => {
      fetch('/fileSamples/invalidSample.png')
        .then(res => res.blob())
        .then(resultFile => {
          expect(isWithinSizeLimit(resultFile, 2000)).to.equal(false);
          done();
        });
    });
  });
});
