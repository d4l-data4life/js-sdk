export default class ValidationError extends Error {
  errors: any[];
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export const MISSING_PARAMETERS = 'no passed parameters';
export const INVALID_PARAMETERS = 'invalid parameters';
