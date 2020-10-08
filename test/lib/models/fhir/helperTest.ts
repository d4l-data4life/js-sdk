/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import isEqual from 'lodash/isEqual';

import {
  createCodeableConcept,
  getCodeFromCodeableConcept,
  getDisplayFromCodeableConcept,
  getResource,
} from '../../../../src/lib/models/fhir/helper';

chai.use(sinonChai);

const { expect } = chai;

describe('models/FHIR/helper', () => {
  const resources = [
    {
      resourceType: 'DocumentReference',
      status: 'current',
      id: 'doc-123',
    },
    {
      resourceType: 'DocumentReference',
      status: 'current',
      id: 'doc-456',
    },
    {
      resourceType: 'Patient',
      deceasedBoolean: false,
      id: 'pat-123',
    },
    {
      resourceType: 'Patient',
      deceasedBoolean: false,
      id: 'pat-456',
    },
  ];

  describe('createCodeableConcept', () => {
    it('creates a codeable concept when display, code and system are supplied', () => {
      const codeableConcept = createCodeableConcept('displayValue', 'codeValue', 'systemValue');

      expect(
        isEqual(codeableConcept, {
          coding: [
            {
              code: 'codeValue',
              display: 'displayValue',
              system: 'systemValue',
            },
          ],
        })
      ).to.equal(true);
    });

    it('omits null and undefined values from the codeable concept', () => {
      const codeableConcept = createCodeableConcept('displayValue', null);

      expect(
        isEqual(codeableConcept, {
          coding: [
            {
              display: 'displayValue',
            },
          ],
        })
      ).to.equal(true);
    });

    it('omits empty objects and arrays from the codeable concept', () => {
      // @ts-ignore
      const codeableConcept = createCodeableConcept([], 'codeValue', {});

      expect(
        isEqual(codeableConcept, {
          coding: [
            {
              code: 'codeValue',
            },
          ],
        })
      ).to.equal(true);
    });

    it('does omit NaN values from the codeable concept', () => {
      // @ts-ignore
      const codeableConcept = createCodeableConcept('displayValue', NaN, 'systemValue');

      expect(
        isEqual(codeableConcept, {
          coding: [
            {
              display: 'displayValue',
              system: 'systemValue',
            },
          ],
        })
      ).to.equal(true);
    });

    it('does omit empty strings from the codeable concept', () => {
      const codeableConcept = createCodeableConcept('displayValue', '', 'systemValue');

      expect(
        isEqual(codeableConcept, {
          coding: [
            {
              display: 'displayValue',
              system: 'systemValue',
            },
          ],
        })
      ).to.equal(true);
    });

    it('does omit false from the codeable concept', () => {
      // @ts-ignore
      const codeableConcept = createCodeableConcept('displayValue', false, 'systemValue');

      expect(
        isEqual(codeableConcept, {
          coding: [
            {
              display: 'displayValue',
              system: 'systemValue',
            },
          ],
        })
      ).to.equal(true);
    });
  });

  describe('getCodeFromCodeableConcept', () => {
    it('gets the code from a codeableConcept', () => {
      const concept = {
        coding: [
          {
            code: 'codeValue',
            display: 'displayValue',
            system: 'systemValue',
          },
        ],
      };

      expect(getCodeFromCodeableConcept(concept)).to.equal('codeValue');
    });

    it('gets no value from a codeableConcept if no code is given, but does not fail', () => {
      const concept = {
        coding: [
          {
            display: 'displayValue',
            system: 'systemValue',
          },
        ],
      };

      expect(getCodeFromCodeableConcept(concept)).to.equal(undefined);
    });
  });

  describe('getDisplayFromCodeableConcept', () => {
    it('gets the display string from a codeableConcept', () => {
      const concept = {
        coding: [
          {
            code: 'codeValue',
            display: 'displayValue',
            system: 'systemValue',
          },
        ],
      };

      expect(getDisplayFromCodeableConcept(concept)).to.equal('displayValue');
    });

    it('gets no value from a codeableConcept if no display is given, but does not fail', () => {
      const concept = {
        coding: [
          {
            code: 'codeValue',
            system: 'systemValue',
          },
        ],
      };

      expect(getDisplayFromCodeableConcept(concept)).to.equal(undefined);
    });
  });

  describe('getResource', () => {
    it('correctly matches the resource with a matching id', () => {
      const foundResource = getResource({ reference: '#pat-123' }, resources);

      expect(foundResource.resourceType).to.equal('Patient');
      // @ts-ignore
      expect(foundResource.deceasedBoolean).to.equal(false);
      expect(foundResource.id).to.equal('pat-123');
    });
  });
});
