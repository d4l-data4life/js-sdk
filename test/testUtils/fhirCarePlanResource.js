// JSON is the single source of truth and
// should be easily exchanged exchanged with
// fellow SDK devs across plattforms.

/* eslint-disable quote-props */
/* eslint-disable comma-dangle */
/* eslint-disable quotes */

export default {
  resourceType: 'CarePlan',
  id: '010296ef-4f32-4b7c-94dd-69db8074dc91',
  status: 'active',
  intent: 'plan',
  subject: {
    reference: '#bb13afe8-dc33-4877-9909-9a7582d9469c',
  },
  author: [
    {
      reference: '#2744878e-a12f-4bf9-bbbd-ebedbbc25841',
    },
  ],
  activity: [
    {
      reference: {
        reference: '#6e5888f2-05a1-48ff-a341-924e7757db2a',
      },
    },
    {
      reference: {
        reference: '#b1f86df4-f2b1-4c4a-a6f6-de96ed4d087a',
      },
    },
  ],
  contained: [
    {
      resourceType: 'Patient',
      id: 'bb13afe8-dc33-4877-9909-9a7582d9469c',
      name: [
        {
          family: 'Smoak',
          given: ['Felicity'],
        },
      ],
    },
    {
      resourceType: 'Practitioner',
      id: '2744878e-a12f-4bf9-bbbd-ebedbbc25841',
      name: [
        {
          text: 'Dr. Bruce Banner, Praxis fuer Allgemeinmedizin',
        },
      ],
    },
    {
      resourceType: 'Medication',
      id: '8f0c117e-8808-43ba-98af-f9418e32595b',
      ingredient: [
        {
          itemReference: {
            reference: '#521527f5-68e3-4467-90a0-730f4ad4032f',
          },
          amount: {
            numerator: {
              value: 400,
              system: 'mg',
            },
          },
        },
      ],
      form: {
        coding: [
          {
            display: 'tablets',
          },
        ],
      },
      code: {
        coding: [
          {
            display: 'Ibuprofen-ratiopharm',
          },
        ],
      },
    },
    {
      resourceType: 'Substance',
      id: '521527f5-68e3-4467-90a0-730f4ad4032f',
      code: {
        coding: [
          {
            display: 'Ibuprofen',
          },
        ],
      },
    },
    {
      resourceType: 'Patient',
      id: 'bb13afe8-dc33-4877-9909-9a7582d9469c',
      name: [
        {
          family: 'Smoak',
          given: ['Felicity'],
        },
      ],
    },
    {
      resourceType: 'MedicationRequest',
      id: '6e5888f2-05a1-48ff-a341-924e7757db2a',
      intent: 'plan',
      subject: {
        reference: '#bb13afe8-dc33-4877-9909-9a7582d9469c',
      },
      dosageInstruction: [
        {
          timing: {
            repeat: {
              when: ['morning'],
            },
          },
          doseQuantity: {
            value: 2,
            unit: 'Stueck',
          },
        },
        {
          timing: {
            repeat: {
              when: ['evening'],
            },
          },
          doseQuantity: {
            value: 2,
            unit: 'Stueck',
          },
        },
      ],
      note: [
        {
          text: 'zur Oralen Einnahme',
        },
      ],
      reasonCode: [
        {
          coding: [
            {
              display: 'Erkaeltungsbeschwerden bekaempfen',
            },
          ],
        },
      ],
      medicationReference: {
        reference: '#8f0c117e-8808-43ba-98af-f9418e32595b',
      },
    },
    {
      resourceType: 'Medication',
      id: 'd21a100e-a39b-4ea8-ad35-58c59aa9cb14',
      ingredient: [
        {
          itemReference: {
            reference: '#587e8df5-f519-45d8-879c-c84082ab6276',
          },
          amount: {
            numerator: {
              value: 100,
              system: 'mg',
            },
          },
        },
      ],
    },
    {
      resourceType: 'Substance',
      id: '587e8df5-f519-45d8-879c-c84082ab6276',
      code: {
        coding: [
          {
            display: 'Acetylsalicylic Acid',
          },
        ],
      },
    },
    {
      resourceType: 'Patient',
      id: 'bb13afe8-dc33-4877-9909-9a7582d9469c',
      name: [
        {
          family: 'Smoak',
          given: ['Felicity'],
        },
      ],
    },
    {
      resourceType: 'MedicationRequest',
      id: 'b1f86df4-f2b1-4c4a-a6f6-de96ed4d087a',
      intent: 'plan',
      subject: {
        reference: '#bb13afe8-dc33-4877-9909-9a7582d9469c',
      },
      dosageInstruction: [
        {
          text: '2 Tabletten mittags, 2 Nachts',
        },
      ],
      medicationReference: {
        reference: '#d21a100e-a39b-4ea8-ad35-58c59aa9cb14',
      },
    },
  ],
};
