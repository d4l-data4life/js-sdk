export default class SetupError {
  name: string;
  message: string;
  constructor(message) {
    this.name = 'SetupError';
    this.message = message || '';
  }
}

export const NOT_SETUP = 'the SDK was not set up correctly';
