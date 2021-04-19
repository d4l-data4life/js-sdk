/* eslint-disable no-unused-expressions */
/* eslint-env mocha */
import 'babel-polyfill';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import taggingUtils, { tagKeys } from '../../src/lib/taggingUtils';
import testVariables from '../testUtils/testVariables';
import documentResources from '../testUtils/documentResources';

chai.use(sinonChai);

const { expect } = chai;

describe('taggingUtils', () => {
  const fhirObject = {
    resourceType: 'Patient',
    id: 'example',
    identifier: [
      {
        use: 'usual',
        type: {
          coding: [
            {
              system: 'http://hl7.org/fhir/v2/0203',
              code: 'MR',
            },
          ],
        },
        system: 'urn:oid:1.2.36.146.595.217.0.1',
        value: '12345',
        period: {
          start: '2001-05-06',
        },
        assigner: {
          display: 'Acme Healthcare',
        },
      },
    ],
    active: true,
    gender: 'male',
    birthDate: '1974-12-25',
    deceasedBoolean: false,
    managingOrganization: {
      reference: 'Organization/1',
    },
  };

  beforeEach(() => {
    taggingUtils.setPartnerId(testVariables.partnerId);
  });

  afterEach(() => {
    taggingUtils.reset();
  });

  describe('generateTagsFromFhir', () => {
    it('verifies that correct tag values are generated', () => {
      const tags = taggingUtils.generateTagsFromFhir(fhirObject);
      expect(tags.length).to.equal(1);
      expect(tags[0]).to.equal('resourcetype=patient');
    });

    it("verifies that no resourcetype tag is generated if it doesn't exist", () => {
      const tags = taggingUtils.generateTagsFromFhir({});
      expect(tags.length).to.equal(0);
    });
  });

  describe('generateCreationTag', () => {
    it('verifies that correct tag value is generated', () => {
      const tag = taggingUtils.generateCreationTag();
      expect(tag).to.equal('partner=partner%5fid');
    });
  });

  describe('generateUpdateTag', () => {
    it('verifies that correct tag value is generated', () => {
      const tag = taggingUtils.generateUpdateTag();
      expect(tag).to.equal('updatedbypartner=partner%5fid');
    });
  });

  it('verifies that buildTag returns correctly encoded tag', () => {
    const tag = taggingUtils.buildTag(
      ";,/?:@&=+$#-_.!~*'()ABC abc 123",
      ";,/?:@&=+$#-_.!~*'()ABC abc 123"
    );
    expect(tag).to.equal(
      '%3B%2C%2F%3F%3A%40%26%3D%2B%24%23%2d%5f%2e%21%7e%2a%27%28%29abc%20abc%20123=' +
        '%3B%2C%2F%3F%3A%40%26%3D%2B%24%23%2d%5f%2e%21%7e%2a%27%28%29abc%20abc%20123'
    );
  });

  it('returns correct tag value when getTagValueFromList is called with list and tag', () => {
    const tagValue = taggingUtils.getTagValueFromList(
      [testVariables.tag, testVariables.updatedByPartnerTag, testVariables.secondTag],
      tagKeys.partner
    );
    expect(tagValue).to.equal('1');
  });

  it('returns correct annotations when tagsList is passed', () => {
    const annotations = taggingUtils.getAnnotations([
      testVariables.tag,
      testVariables.secondTag,
      ...taggingUtils.generateCustomTags({ annotations: documentResources.annotations }),
    ]);
    expect(annotations.toString()).to.equal(documentResources.annotations.toString());
  });

  describe('getValue', () => {
    it('returns correct tag-value when  is called with tag', () => {
      const tagValue = taggingUtils.getValue(testVariables.secondTag);
      expect(tagValue).to.equal('1');
    });

    it('returns correct tag-value when  is called with encoded tag', () => {
      const tagValue = taggingUtils.getValue(testVariables.encodedTag);
      expect(tagValue).to.equal('ann_otation');
    });

    it('returns undefined whencalled with incorrect tag format', () => {
      const tagValue = taggingUtils.getValue('client%2');
      expect(tagValue).to.equal(undefined);
    });
  });
});
