import hcSpecialty from '../../src/lib/models/D4LSpecialty';

const documentResources = {
  files: [new File(['test'], 'testName'), new File(['test'], 'testName')],
  creationDate: new Date('Thu, 23 Nov 2017 22:57:55 GMT'),
  customCreationDate: new Date('December 17, 1995'),
  updatedDate: new Date('2018-12-17T03:24:00'),
  title: 'title',
  type: 'type',
  additionalIds: {
    1: 'id1',
  },
  author: {
    id: 'custom',
    firstName: 'John',
    lastName: 'Doe',
    prefix: 'Captain',
    suffix: 'Sr.',
    street: 'Danenstasse',
    city: 'Berlin',
    postalCode: '10439',
    telephone: '061-221-9176',
    website: 'http://johndoe.me',
    specialty: hcSpecialty.AdultMentalIllness,
  },
  annotations: ['annotation1', 'annotation2'],
};
export default documentResources;
