import testVariables from './testVariables';

const r4FhirResources = {
  documentReference: {
    id: 'recordid',
    resourceType: 'DocumentReference',
    status: 'current',
    date: testVariables.dateTimeString,
    type: {
      text: 'Document',
    },
    author: [{ display: 'Julius' }],
    subject: { reference: 'CT' },
    content: [
      {
        attachment: {
          id: testVariables.fileId,
          title: '20171214_131101.jpg',
          contentType: 'image/jpeg',
          creation: testVariables.dateString,
        },
      },
    ],
  },
  documentReference2: {
    resourceType: 'DocumentReference',
    status: 'current',
    type: {
      coding: [
        {
          display: 'LabBefund',
        },
      ],
    },
    author: [
      {
        reference: '#contained-author-id',
      },
    ],
    description: 'sefsf',
    subject: {
      reference: 'sefsf',
    },
    contained: [],
    content: [
      {
        attachment: {
          contentType: 'image/png',
          creation: '2020-10-08T10:00:00.000Z',
          title: 'Bildschirmfoto 2020-10-13 um 17.18.54.png',
        },
      },
    ],
    date: '2020-10-08T10:00:00.000Z',
  },
};

export default r4FhirResources;
