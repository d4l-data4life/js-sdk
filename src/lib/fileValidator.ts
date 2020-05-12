import intersection from 'lodash/intersection';
import { IBlobFile } from './BlobFile';
import { getFileContentsAsBuffer } from './attachmentUtils';

/* We will validate the incoming files based on the signatures.
   The reference signature values are taken from
   https://en.wikipedia.org/wiki/List_of_file_signatures and
   https://www.filesignatures.net
*/

interface IFileSignature {
  // byteSeq is the representation of signature found in a particular file type
  byteSeq: Uint8Array;
  // extensions are the file types supported with a given file signature
  extensions: string[];
  // offset is the position in the file buffer array where the signature value is present.
  // Most commonly the offset is 0, but in some cases it can be somthing else. In our case,
  // the dcm files are the exceptions with offset 128.
  offset: number;
}
const fileSignatures: IFileSignature[] = [
  {
    byteSeq: new Uint8Array([0xff, 0xd8, 0xff, 0xdb]),
    extensions: ['jpg', 'jpeg'],
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
    extensions: ['jpg', 'jpeg'], // JPEG, JFIF, JPG, JPE
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0xff, 0xd8, 0xff, 0xe1]),
    extensions: ['jpg', 'jpeg'], // EXIF
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0xff, 0xd8, 0xff, 0xe2]),
    extensions: ['jpg', 'jpeg'], // Canon
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0xff, 0xd8, 0xff, 0xe3]),
    extensions: ['jpg', 'jpeg'], // Samsung
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0xff, 0xd8, 0xff, 0xe8]),
    extensions: ['jpg', 'jpeg'], // Still Picture Interchange File Format (SPIFF)
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    extensions: ['png'],
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0x4d, 0x4d, 0x00, 0x2a]),
    extensions: ['tiff'], // big endian
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0x49, 0x49, 0x2a, 0x00]),
    extensions: ['tiff'], // little endian
    offset: 0,
  },
  {
    byteSeq: new Uint8Array([0x44, 0x49, 0x43, 0x4d]),
    extensions: ['dcm'],
    offset: 128, // dcm file signatures have an offset of 0X80 which in decimal is 128
  },
  {
    byteSeq: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
    extensions: ['pdf'],
    offset: 0,
  },
];

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'tiff'];
const NATIVE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const MAXIMUM_FILE_SIZE = 20 * 1024 * 1024; // 20 megabytes should be enough for everyone

const imageFileSignatures = fileSignatures.filter(
  signature => intersection(signature.extensions, IMAGE_EXTENSIONS).length > 0
);

const resizableImageFileSignatures = fileSignatures.filter(
  signature => intersection(signature.extensions, NATIVE_IMAGE_EXTENSIONS).length > 0
);

export const matchesFileSignature = (byteSequence: Uint8Array, signatureList: IFileSignature[]) =>
  signatureList.some(signature =>
    signature.byteSeq.every((byte, index) => byte === byteSequence[signature.offset + index])
  );

export const isImageFile = (file: IBlobFile) =>
  new Promise(resolve => {
    getFileContentsAsBuffer(file).then(fileContent => {
      resolve(
        matchesFileSignature(new Uint8Array(fileContent as ArrayBuffer), imageFileSignatures)
      );
    });
  });

export const isAllowedByteSequence = (byteSequence: Uint8Array) =>
  matchesFileSignature(byteSequence, fileSignatures);

export const isImageByteSequence = (byteSequence: Uint8Array) =>
  matchesFileSignature(byteSequence, imageFileSignatures);

export const isResizableImageByteSequence = (byteSequence: Uint8Array) =>
  matchesFileSignature(byteSequence, resizableImageFileSignatures);

export const isAllowedFileType = (file: IBlobFile) =>
  new Promise((resolve, reject) => {
    getFileContentsAsBuffer(file).then(fileContent => {
      if (matchesFileSignature(new Uint8Array(fileContent as ArrayBuffer), fileSignatures)) {
        resolve(true);
      } else {
        reject(
          new Error('Unsupported file type. Permitted file types are jpg, png, tiff, pdf and dcm.')
        );
      }
    });
  });

export const isWithinSizeLimit = (file: IBlobFile, limit: number = MAXIMUM_FILE_SIZE) =>
  file.size <= limit;
