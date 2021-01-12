// JSON is the single source of truth and
// should be easily exchanged exchanged with
// fellow SDK devs across plattforms.

/* eslint-disable quote-props */
/* eslint-disable comma-dangle */
/* eslint-disable quotes */

export default {
  resourceType: 'Practitioner',
  id: 'example',
  identifier: [
    {
      system: 'http://www.acme.org/practitioners',
      value: '23',
    },
  ],
  active: true,
  name: [
    {
      family: 'Careful',
      given: ['Adam'],
      prefix: ['Dr'],
    },
  ],
  address: [
    {
      use: 'home' as fhir.AdressUse,
      line: ['534 Erewhon St'],
      city: 'PleasantVille',
      state: 'Vic',
      postalCode: '3999',
    },
  ],
  qualification: [
    {
      identifier: [
        {
          system: 'http://example.org/UniversityIdentifier',
          value: '12345',
        },
      ],
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/v2/0360/2.7',
            code: 'BS',
            display: 'Bachelor of Science',
          },
        ],
        text: 'Bachelor of Science',
      },
      period: {
        start: '1995',
      },
      issuer: {
        display: 'Example University',
      },
    },
  ],
};
