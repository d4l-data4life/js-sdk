// This class exists because IE11 and Edge don't support the constructor of the FileAPI
interface IOptsType {
  lastModifiedDate?: Date;
  lastModified?: number;
  type?: string;
}

export interface IBlobFile extends Blob {
  name?: string;
  lastModifiedDate?: Date;
  lastModified?: number;
}

// tslint:disable-next-line variable-name
const BlobFile = (data: any[], name: string, opts: IOptsType): IBlobFile => {
  const lastModified = opts.lastModified || Date.now();
  const blobFile: IBlobFile = new Blob(data, { type: opts.type });
  blobFile.name = name;
  blobFile.lastModified = lastModified;
  blobFile.lastModifiedDate = new Date(lastModified);
  return blobFile;
};

export default BlobFile;
