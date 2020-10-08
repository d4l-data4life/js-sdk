export default class InvalidAttachmentPayloadError extends Error {
  errors: any[];

  constructor(message, errors = []) {
    super(message);
    this.name = 'InvalidAttachmentPayloadError';
    this.errors = errors;
  }
}
