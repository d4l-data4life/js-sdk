import testVariables from './testVariables';

const fhirResources = {
  documentReference: {
    id: 'record_id',
    resourceType: 'DocumentReference',
    status: 'current',
    type: {
      text: 'Document',
    },
    indexed: testVariables.dateTimeString,
    author: [{ display: 'Julius' }],
    subject: { reference: 'CT' },
    content: [
      {
        attachment: {
          id: testVariables.fileId,
          title: '20171214_131101.jpg',
          contentType: 'image/jpeg',
          creation: testVariables.dateTimeString,
        },
      },
    ],
  },
  carePlan: {
    resourceType: 'CarePlan',
    contained: [
      {
        resourceType: 'Condition',
        id: 'p1',
        clinicalStatus: 'active',
        verificationStatus: 'confirmed',
        code: {
          text: 'Obesity',
        },
        subject: {
          reference: 'Patient/example',
          display: 'Peter James Chalmers',
        },
      },
    ],
    identifier: [
      {
        value: '12345',
      },
    ],
    definition: [
      {
        display: 'A PlanDefinition protocol for obesity',
      },
    ],
    basedOn: [
      {
        display: 'Management of Type 2 Diabetes',
      },
    ],
    status: 'active',
    intent: 'plan',
    category: [
      {
        text: 'Weight management plan',
      },
    ],
    description: 'Manage obesity and weight loss',
    subject: {
      reference: 'Patient/example',
      display: 'Peter James Chalmers',
    },
    context: {
      reference: 'Encounter/home',
    },
    period: {
      end: '2017-06-01',
    },
    author: [
      {
        reference: 'Practitioner/example',
        display: 'Dr Adam Careful',
      },
    ],
    careTeam: [
      {
        reference: 'CareTeam/example',
      },
    ],
    addresses: [
      {
        reference: '#p1',
        display: 'obesity',
      },
    ],
    goal: [
      {
        reference: 'Goal/example',
      },
    ],
    activity: [
      {
        outcomeCodeableConcept: [
          {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '161832001',
                display: 'Progressive weight loss',
              },
            ],
          },
        ],
        outcomeReference: [
          {
            reference: 'Observation/example',
            display: 'Weight Measured',
          },
        ],
        detail: {
          category: {
            coding: [
              {
                system: 'http://hl7.org/fhir/care-plan-activity-category',
                code: 'observation',
              },
            ],
          },
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '3141-9',
                display: 'Weight Measured',
              },
              {
                system: 'http://snomed.info/sct',
                code: '27113001',
                display: 'Body weight',
              },
            ],
          },
          status: 'completed',
          statusReason: 'Achieved weight loss to mitigate diabetes risk.',
          prohibited: false,
          scheduledTiming: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'd',
            },
          },
          location: {
            display: "Patient's home",
          },
          performer: [
            {
              reference: 'Patient/example',
              display: 'Peter James Chalmers',
            },
          ],
        },
      },
    ],
  },
  observation: {
    resourceType: 'Observation',
    id: 'example',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://hl7.org/fhir/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '29463-7',
          display: 'Body Weight',
        },
        {
          system: 'http://loinc.org',
          code: '3141-9',
          display: 'Body weight Measured',
        },
        {
          system: 'http://snomed.info/sct',
          code: '27113001',
          display: 'Body weight',
        },
        {
          system: 'http://acme.org/devices/clinical-codes',
          code: 'body-weight',
          display: 'Body Weight',
        },
      ],
    },
    subject: {
      reference: 'Patient/example',
    },
    context: {
      reference: 'Encounter/example',
    },
    effectiveDateTime: '2016-03-28',
    valueQuantity: {
      value: 185,
      unit: 'lbs',
      system: 'http://unitsofmeasure.org',
      code: '[lb_av]',
    },
  },
  encryptedFhir: 'encryptedFhir',
};

export default fhirResources;
