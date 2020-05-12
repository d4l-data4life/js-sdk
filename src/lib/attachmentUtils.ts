/* tslint:disable:ter-indent */
// @ts-ignore
import { hash } from 'hc-crypto';
import find from 'lodash/find';

import isUndefined from 'lodash/isUndefined';
import { IBlobFile } from './BlobFile';
import { getCleanAttachmentsFromResource } from '../services/fhirService';

export const separateOldAndNewAttachments = (newDocumentAttachments, oldDocumentAttachments) =>
  newDocumentAttachments.reduce(
    (accumulator, attachment) => {
      const { hash = null, id = null } = attachment;
      const match = find(oldDocumentAttachments, { hash }) || find(oldDocumentAttachments, { id });

      if (match) {
        attachment.id = match.id;
        accumulator[0].push(attachment);
        return accumulator;
      }

      accumulator[1].push(attachment);
      return accumulator;
    },
    [[], []]
  );

export const getFileContentsAsBuffer = (file: IBlobFile) =>
  new Promise(resolve => {
    const fileReader = new FileReader();
    fileReader.onload = (event: any) => resolve(event.target.result);
    fileReader.readAsArrayBuffer(file);
  });

export const getContentHash = (file: any): Promise<string> =>
  new Promise(resolve => {
    getFileContentsAsBuffer(file).then(result => {
      resolve(hash(result, 'SHA-1'));
    });
  });

const getAttachmentIncrementor = attachment => {
  if (attachment.hasPreview) {
    // full size, preview, thumb
    return 3;
  }

  if (attachment.hasThumb) {
    // full size, thumb
    return 2;
  }

  // full size
  return 1;
};

export const getEncryptedFilesByAttachmentIndex = (encryptedFiles, attachments, index) => {
  const start = attachments
    .slice(0, index)
    .reduce((acc, attachment) => acc + getAttachmentIncrementor(attachment), 0);
  return encryptedFiles.slice(start, start + getAttachmentIncrementor(attachments[index]));
};

export const IMAGE_SIZE_EXPLANATION_KEY = ['d4l_f_p_t'];
export const FULL = 'full';
export const PREVIEW = 'preview';
export const THUMBNAIL = 'thumbnail';
export const DEFAULT_IMAGE_SIZE_MAP = {
  [FULL]: undefined,
  [PREVIEW]: undefined,
  [THUMBNAIL]: undefined,
};

const PAYLOAD_VERIFICATION_CUTOFF_DATE = new Date('2020-03-13T00:00:00.000Z');

export const getIdentifierValue = uploadInformation => {
  const sources = [...uploadInformation];
  const value = [
    ...IMAGE_SIZE_EXPLANATION_KEY,
    ...[...Array(3).keys()]
      .map(() => {
        /* reverse assignment:
         * slot 2 (thumbnail) = thumbnail / full-size (if no thumbnail)
         * slot 1 (preview)   = preview / full-size (if no preview)
         * slot 0 (full-size) = full-size
         * (uploadInformation[0] is the full-size fallback)
         */
        const source = sources.pop() || uploadInformation[0];
        return source.document_id;
      })
      .reverse(),
  ];

  /* Possible values:
   * <size-key>#<full-size-id>#<preview-id>#<thumbnail-id>
   * <size-key>#<full-size-id>#<full-size-id>#<thumbnail-id>
   * <size-key>#<full-size-id>#<full-size-id>#<full-size-id>
   */

  return {
    value: value.join('#'),
  };
};

// tslint:disable-next-line:variable-name
const ImageProcessor = {
  getProcessor() {
    if (this.imageProcessor) {
      return this.imageProcessor;
    }
    return new Promise(resolve => {
      // @ts-ignore
      // tslint:disable-next-line:import-name
      import('pica').then(({ default: pica }) => {
        this.imageProcessor = pica({ features: ['js'] });
        return resolve(this.imageProcessor);
      });
    });
  },
};

export const shrinkImageHeightIfNeeded = (name: string, file: IBlobFile, height: number) =>
  new Promise(resolve => {
    const originalImage = new Image();

    originalImage.onload = async () => {
      if (originalImage.height <= height) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.height = height;
      canvas.width = (height * originalImage.width) / originalImage.height;

      // other settings than quality 0 will produce odd artifacts
      (await ImageProcessor.getProcessor())
        .resize(originalImage, canvas, { quality: 0 })
        .then(async resizedImage => {
          (await ImageProcessor.getProcessor())
            .toBlob(resizedImage, 'image/jpeg') // removes alpha channel :-(
            .then(blob => {
              resolve(new File([blob], name));
            });
        });
    };

    originalImage.src = URL.createObjectURL(file);
  });

export const verifyAttachmentPayload = async (
  attachment,
  attachmentFile,
  downloadedFullSizeAttachment
) => {
  if (
    !downloadedFullSizeAttachment ||
    new Date(attachment.creation) <= PAYLOAD_VERIFICATION_CUTOFF_DATE
  ) {
    return true;
  }
  const attachmentFileHash = await getContentHash(attachmentFile);
  return attachmentFileHash === attachment.hash;
};

export const hasAttachments = resource => getCleanAttachmentsFromResource(resource).length > 0;

export const getAttachmentIdToDownload = (identifier, options, attachment) => {
  if (identifier?.length && options.imageSize !== FULL) {
    const matchingIdentifier = find(identifier, attachmentData =>
      attachmentData.value.includes(attachment.id)
    );

    if (!isUndefined(matchingIdentifier)) {
      const imageSizes = { ...DEFAULT_IMAGE_SIZE_MAP };
      [
        imageSizes[FULL],
        imageSizes[PREVIEW],
        imageSizes[THUMBNAIL],
      ] = matchingIdentifier.value.split('#').slice(1);
      if (imageSizes[options.imageSize]) {
        return imageSizes[options.imageSize];
      }
    }
  }
  return attachment.id;
};
