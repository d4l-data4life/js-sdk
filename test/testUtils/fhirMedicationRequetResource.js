// JSON is the single source of truth and
// should be easily exchanged exchanged with
// fellow SDK devs across plattforms.

/* eslint-disable quote-props */
/* eslint-disable comma-dangle */
/* eslint-disable quotes */

export const medicationRequestWithFrequency = {
  resourceType: 'MedicationRequest',
  id: '7a08af19-dde1-442a-a11c-05981ccfc229',
  intent: 'plan',
  subject: {
    reference: '#d2722b52-e023-4e13-b591-ba7d465d3b61',
  },
  dosageInstruction: [
    {
      timing: {
        repeat: {
          frequency: 14,
          period: 12,
          periodUnit: 'h',
        },
      },
    },
  ],
  medicationReference: {
    reference: '#2330cd42-433b-46ec-82e0-a26addbafb38',
  },
  contained: [
    {
      resourceType: 'Medication',
      id: '2330cd42-433b-46ec-82e0-a26addbafb38',
      ingredient: [
        {
          itemReference: {
            reference: '#549eb5f1-9e34-4355-af43-0536511cf0bb',
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
    },
    {
      resourceType: 'Substance',
      id: '549eb5f1-9e34-4355-af43-0536511cf0bb',
      code: {
        coding: [
          {
            display: 'Ibuprofen',
          },
        ],
      },
    },
  ],
};

export const medicationRequestInstruction = {
  resourceType: 'MedicationRequest',
  id: '0ca30cfc-727d-4246-a98c-73bd6b74ae27',
  intent: 'plan',
  subject: {
    reference: '#b0c2f8f4-2cec-4fd2-906a-d537bfa36625',
  },
  dosageInstruction: [
    {
      text: '2 Tabletten morgen, 2 Abends, fuer eine Woche',
    },
  ],
  medicationReference: {
    reference: '#d64f2eb1-0241-4583-98c9-ea4b49ff3b42',
  },
  contained: [
    {
      resourceType: 'Medication',
      id: 'd64f2eb1-0241-4583-98c9-ea4b49ff3b42',
      ingredient: [
        {
          itemReference: {
            reference: '#cdac5351-d236-4f5c-ac64-a2144f42ea9b',
          },
          amount: {
            numerator: {
              value: 400,
              system: 'mg',
            },
          },
        },
      ],
    },
    {
      resourceType: 'Substance',
      id: 'cdac5351-d236-4f5c-ac64-a2144f42ea9b',
      code: {
        coding: [
          {
            display: 'Ibuprofen',
          },
        ],
      },
    },
  ],
};

export const medicationRequestBMP = {
  resourceType: 'MedicationRequest',
  id: 'a8359bb8-7605-4ef5-aaa4-d5b933d39de9',
  intent: 'plan',
  subject: {
    reference: '#08eb9129-deb1-4d2b-a3c9-4630d3712e43',
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
    reference: '#94064dfa-ee40-48e2-957b-4dadc4c9dd8b',
  },
  contained: [
    {
      resourceType: 'Medication',
      id: '94064dfa-ee40-48e2-957b-4dadc4c9dd8b',
      ingredient: [
        {
          itemReference: {
            reference: '#e575c67a-4aa1-4e86-af54-786f4158f584',
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
      id: 'e575c67a-4aa1-4e86-af54-786f4158f584',
      code: {
        coding: [
          {
            display: 'Ibuprofen',
          },
        ],
      },
    },
  ],
};
