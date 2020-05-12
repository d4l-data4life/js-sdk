/* eslint-disable lines-between-class-members */
import { IBlobFile } from '../../BlobFile';

export interface AttachmentConstructor {
  file?: IBlobFile;
  title?: string;
  contentType?: fhir.code;
  creation?: Date;
  id?: string;
}

export default class Attachment implements fhir.Attachment {
  file: any;
  id: string;
  size?: number;
  title?: string;
  hash?: string;
  contentType?: fhir.code;
  creation?: fhir.dateTime;

  constructor({ file, title, contentType, creation, id }: AttachmentConstructor) {
    this.file = file;
    this.id = id;
    this.title = title;
    this.contentType = contentType;
    this.creation = creation.toISOString();
  }
}
