/* eslint-disable no-useless-escape */
import isArray from 'lodash/isArray';
import isDate from 'lodash/isDate';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';

// https://github.com/asaskevich/govalidator/blob/v8/patterns.go#L7
import ValidationError from './errors/ValidationError';

// eslint-disable-next-line max-len
const emailRegex = /^((([a-zA-Z]|\d|[!#$%&'*+\-\/=?^_`{|}~]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])+(\.([a-zA-Z]|\d|[!#$%&'*+\-\/=?^_`{|}~]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])+)*)|((\u{22})((([\u{20}\u{09}]*(\u{0d}\u{0a}))?[\u{20}\u{09}]+)?(([\u{01}-\u{08}\u{0b}\u{0c}\u{0e}-\u{1f}\u{7f}]|\u{21}|[\u{23}-\u{5b}]|[\u{5d}-\u{7e}]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])|(\([\u{01}-\u{09}\u{0b}\u{0c}\u{0d}-\u{7f}]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}]))))*(([\u{20}\u{09}]*(\u{0d}\u{0a}))?[\u{20}\u{09}]+)?(\u{22}))@((([a-zA-Z]|\d|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])|(([a-zA-Z]|\d|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])([a-zA-Z]|\d|-|\.|_|~|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])*([a-zA-Z]|\d|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])))\.)+(([a-zA-Z]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])|(([a-zA-Z]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])([a-zA-Z]|\d|-|_|~|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])*([a-zA-Z]|[\u{00A0}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}])))\.?$/iu;

const isNotEmpty = key => key?.length > 0;

const isBlobIfExists = value => !value || value instanceof Blob;

const isObjectIfExists = value => !value || isObject(value);

const isStringIfExists = value => !value || isString(value);

const isDateIfExists = value => !value || isDate(value);

const ensureArrayIfExists = (value, propertyName?) => {
  if (isUndefined(value)) {
    return value;
  }
  if (!isArray(value)) {
    throw new ValidationError(`Property: ${propertyName} must be Array`);
  }

  return value;
};

const ensureDateIfExists = (value, propertyName?) => {
  if (isDateIfExists(value)) {
    return value;
  }
  try {
    if (!isString(value)) {
      throw new Error();
    }
    return new Date(value);
  } catch (err) {
    throw new ValidationError(
      `Property: ${propertyName} must be Date or a valid Date string representation`
    );
  }
};

const validateEmail = (email: string): boolean => emailRegex.test(email);

export {
  isNotEmpty,
  isDateIfExists,
  isStringIfExists,
  isObjectIfExists,
  isBlobIfExists,
  ensureArrayIfExists,
  ensureDateIfExists,
  validateEmail,
};
