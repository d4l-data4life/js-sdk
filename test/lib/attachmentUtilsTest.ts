/* eslint-disable no-unused-expressions */
/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import {
  getContentHash,
  getAttachmentIdToDownload,
  getFileContentsAsBuffer,
  getIdentifierValue,
  shrinkImageHeightIfNeeded,
  verifyAttachmentPayload,
  PREVIEW,
  FULL,
  THUMBNAIL,
  IMAGE_SIZE_EXPLANATION_KEY,
} from '../../src/lib/attachmentUtils';

chai.use(sinonChai);

const { expect } = chai;

describe('getIdentifierValue', () => {
  const IMAGE_SIZE_EXPLANATION_KEY_AS_STRING = 'd4l_f_p_t';

  it('assembles the correct identifierValue for an image with both thumb and prev', () => {
    const uploadInformationMock = [
      { document_id: 'full-id-image-1' },
      { document_id: 'prev-id-image-1' },
      { document_id: 'thumb-id-image-1' },
    ];

    const identifier = getIdentifierValue(uploadInformationMock);

    expect(identifier.value).to.equal(
      `${IMAGE_SIZE_EXPLANATION_KEY_AS_STRING}#full-id-image-1#prev-id-image-1#thumb-id-image-1`
    );
  });

  it('assembles the correct identifierValue for an image with only a thumb', () => {
    const uploadInformationMock = [
      { document_id: 'full-id-image-1' },
      { document_id: 'thumb-id-image-1' },
    ];

    const identifier = getIdentifierValue(uploadInformationMock);

    expect(identifier.value).to.equal(
      `${IMAGE_SIZE_EXPLANATION_KEY_AS_STRING}#full-id-image-1#full-id-image-1#thumb-id-image-1`
    );
  });

  it('assembles the correct identifierValue for an image with neither thumb nor preview', () => {
    const uploadInformationMock = [{ document_id: 'full-id-image-1' }];

    const identifier = getIdentifierValue(uploadInformationMock);

    expect(identifier.value).to.equal(
      `${IMAGE_SIZE_EXPLANATION_KEY_AS_STRING}#full-id-image-1#full-id-image-1#full-id-image-1`
    );
  });
});

describe('getFileContentsAsBuffer', () => {
  it('returns a promise with the file contents', done => {
    fetch('/base/test/lib/fileValidator/fileSamples/invalidSample.html')
      .then(res => res.blob())
      .then(getFileContentsAsBuffer)
      .then(contentRes => {
        expect(typeof contentRes).to.equal('object');
        // needs to be converted: https://github.com/node-file-api/FileReader/issues/2
        // @ts-ignore
        const convertedUint8Array = new Uint8Array(contentRes);
        expect(typeof convertedUint8Array).to.equal('object');
        expect(convertedUint8Array.length).to.equal(40);
        done();
      })
      .catch(done);
  });
});

describe('getContentHash', () => {
  it('returns the correct hash for the sample file', done => {
    fetch('/base/test/lib/fileValidator/fileSamples/sample.jpg')
      .then(res => res.blob())
      .then(getContentHash)
      .then(result => {
        expect(result).to.equal('7dStypYfA3YtwUrd10xJz5HWVDU=');
        done();
      })
      .catch(done);
  });
});

describe('shrinkImageHeightIfNeeded', () => {
  it('does not shrink an image if it is already smaller then the target size', done => {
    fetch('/base/test/lib/fileValidator/fileSamples/sample.png')
      .then(res => res.blob())
      .then(file => shrinkImageHeightIfNeeded('title', file, 2000))
      .then(result => {
        expect(result).to.equal(null);
        done();
      })
      .catch(done);
  });

  it('shrinks an image larger than the target size', () => {
    const TARGET_HEIGHT = 10;
    return fetch('/base/test/lib/fileValidator/fileSamples/sample.png')
      .then(res => res.blob())
      .then(file => shrinkImageHeightIfNeeded('title', file, TARGET_HEIGHT))
      .then(result => {
        expect(result).to.not.equal(null);
        expect(typeof result).to.equal('object');
        const newImageFromResult = new Image();
        newImageFromResult.onload = () => {
          expect(newImageFromResult.height).to.equal(TARGET_HEIGHT);
        };

        newImageFromResult.src = URL.createObjectURL(result);
      });
  });
});

describe('verifyAttachmentPayload', () => {
  const hash = 'KAQJTZLlmmtDAOflfM1a2JxOFfQ=';

  const oldAttachment = {
    hash,
    size: 22,
    creation: '2019-03-12T00:00:00.000Z',
  };

  const newAttachment = {
    hash,
    size: 22,
    creation: '2020-11-15T00:00:00.000Z',
  };

  const newAttachmentWithWrongSize = {
    hash,
    size: 24,
    creation: '2020-11-15T00:00:00.000Z',
  };

  const newAttachmentWithWrongHash = {
    hash: 'definitelynotright',
    size: 22,
    creation: '2020-11-15T00:00:00.000Z',
  };

  const fileContent = { hello: 'world' };
  const file = new Blob([JSON.stringify(fileContent, null, 2)], { type: 'application/json' });
  // @ts-ignore
  file.name = 'filename';

  it('returns true if the the attachment is from before the cutoff date', done => {
    verifyAttachmentPayload(oldAttachment, file, true).then(result => {
      expect(result).to.equal(true);
      done();
    });
  });

  it('returns true if the the attachment is not the full size version', done => {
    verifyAttachmentPayload(newAttachment, file, false).then(result => {
      expect(result).to.equal(true);
      done();
    });
  });

  it('returns true if the the attachment is new and hash and size match', done => {
    verifyAttachmentPayload(newAttachment, file, true).then(result => {
      expect(result).to.equal(true);
      done();
    });
  });

  it('returns true if the the attachment is new and the size does not match (but the hash does) because there is still uncertainty here', done => {
    verifyAttachmentPayload(newAttachmentWithWrongSize, file, true).then(result => {
      expect(result).to.equal(true);
      done();
    });
  });

  it('returns false if the the attachment is new and the hash does not match', done => {
    verifyAttachmentPayload(newAttachmentWithWrongHash, file, true).then(result => {
      expect(result).to.equal(false);
      done();
    });
  });
});

describe('getAttachmentIdToDownload', () => {
  const attachment = {
    id: 'fullid',
  };
  it('returns the original attachment id if no identifier is present', done => {
    const attachmentId = getAttachmentIdToDownload(undefined, { imageSize: PREVIEW }, attachment);
    expect(attachmentId).to.equal(attachment.id);
    done();
  });

  it('returns the original attachment id if an identifier is present and the image size option is set to full', done => {
    const attachmentId = getAttachmentIdToDownload(
      [{ value: `${IMAGE_SIZE_EXPLANATION_KEY}#thumbid#previd#fullid` }],
      { imageSize: FULL },
      attachment
    );

    expect(attachmentId).to.equal(attachment.id);
    done();
  });

  it('returns the original attachment id if there is no matching identifier in the attachment data', done => {
    const attachmentId = getAttachmentIdToDownload(
      [{ value: `${IMAGE_SIZE_EXPLANATION_KEY}#zorkid#previd#thumbid` }],
      { imageSize: PREVIEW },
      attachment
    );

    expect(attachmentId).to.equal(attachment.id);
    done();
  });

  it('returns the correct id for a preview', done => {
    const attachmentId = getAttachmentIdToDownload(
      [{ value: `${IMAGE_SIZE_EXPLANATION_KEY}#fullid#previd#thumbid` }],
      { imageSize: PREVIEW },
      attachment
    );

    expect(attachmentId).to.equal('previd');
    done();
  });

  it('returns the correct id for a thumb', done => {
    const attachmentId = getAttachmentIdToDownload(
      [{ value: `${IMAGE_SIZE_EXPLANATION_KEY}#fullid#previd#thumbid` }],
      { imageSize: THUMBNAIL },
      attachment
    );

    expect(attachmentId).to.equal('thumbid');
    done();
  });
});
