export default class InvalidAttachmentPayloadError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'InvalidAttachmentPayloadError';
    this.errors = errors;
  }
}
