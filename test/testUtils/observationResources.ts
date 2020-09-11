const userId = 'user_id';
const issuedDate = '2018-04-01T15:00:00';
const effectiveDateTime = '2018-04-02T15:00:00';
const observationId = 'observation_id';
const fhirObservation = {
  resourceType: 'Observation',
  issued: issuedDate,
  effectiveDateTime,
  referenceRange: [
    {
      low: {
        value: 80,
        unit: 'mg',
        comparator: '<',
      },
      high: {
        value: 140,
        unit: 'mg',
        comparator: '>',
      },
      type: {
        coding: [
          {
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    },
  ],
  valueQuantity: {
    value: 107,
    unit: 'mmHg',
    comparator: '=',
  },
  status: 'final',
  category: [
    {
      coding: [
        {
          code: 'vital-signs',
          display: 'Vital Signs',
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        code: '85354-9',
        display: 'Bood pressure panel with all children optional',
      },
    ],
    text: 'Blood pressure systolic & diastolic',
  },
};

const observationRecord = {
  record_id: observationId,
  date: '2017-09-19',
  user_id: userId,
  fhirResource: fhirObservation,
  tags: ['tag1', 'tag2'],
  version: 1,
  status: 'Active',
  createdAt: '2017-09-19T09:29:48.278',
};

const hcObservation = {
  issuedDate: new Date('2018-04-01T15:00:00'),
  effectiveDate: new Date('2018-04-02T15:00:00'),
  status: 'amended',
  code: {
    code: '85354-9',
    display: 'Bood pressure panel with all children optional',
  },
  category: [
    {
      code: 'vital-signs',
      display: 'Vital Signs',
    },
  ],
  valueQuantity: {
    value: 107,
    unit: 'mmHg',
    comparator: '=',
  },
  range: [
    {
      low: {
        value: 80,
        unit: 'mg',
        comparator: '<',
      },
      high: {
        value: 140,
        unit: 'mg',
        comparator: '>',
      },
      type: {
        coding: [
          {
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    },
  ],
};

export {
  fhirObservation,
  observationId,
  issuedDate,
  effectiveDateTime,
  observationRecord,
  userId,
  hcObservation,
};
