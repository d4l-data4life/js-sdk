import find from 'lodash/find';

export interface PractitionerConstructor {
  id?: string;
  firstName?: string;
  lastName?: string;
  prefix?: string;
  suffix?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  telephone?: string;
  website?: string;
}

export default class Practitioner implements fhir.Practitioner {
  // tslint:disable-next-line variable-name
  public static fromFHIRObject(FHIRObject: fhir.Practitioner): Practitioner {
    if (!FHIRObject) {
      throw new Error('require 1 argument of type fhir Practitioner');
    }

    const practitioner = new Practitioner({});
    practitioner.resourceType = FHIRObject.resourceType;
    practitioner.id = FHIRObject.id;
    practitioner.identifier = FHIRObject.identifier;
    practitioner.name = FHIRObject.name;
    practitioner.address = FHIRObject.address;
    practitioner.telecom = FHIRObject.telecom;

    return practitioner;
  }
  public address?: fhir.Address[];
  public id?: string;
  public identifier?: fhir.Identifier[];
  public name?: fhir.HumanName[];
  public resourceType: string;
  public telecom?: fhir.ContactPoint[];

  constructor({
    firstName,
    lastName,
    prefix,
    suffix,
    street,
    city,
    postalCode,
    telephone,
    website,
  }: PractitionerConstructor) {
    (this.resourceType = 'Practitioner'), (this.id = 'contained-author-id'), (this.identifier = []);
    (this.name = [
      {
        family: lastName,
        given: firstName ? [firstName] : [],
        prefix: prefix ? [prefix] : [],
        suffix: suffix ? [suffix] : [],
      },
    ]),
      (this.address = [
        {
          city,
          postalCode,
          line: street ? [street] : [],
        },
      ]),
      (this.telecom = []);

    if (telephone) {
      this.telecom.push({
        system: 'phone',
        value: telephone,
      });
    }

    if (website) {
      this.telecom.push({
        system: 'url',
        value: website,
      });
    }
    return this;
  }

  public getFirstName(): string {
    return this.name?.[0]?.given?.[0];
  }

  public getLastName(): string {
    return this.name?.[0]?.family;
  }
  public getPrefix(): string {
    return this.name?.[0]?.prefix?.[0];
  }
  public getSuffix(): string {
    return this.name?.[0]?.suffix?.[0];
  }
  public getStreet(): string {
    return this.address?.[0]?.line?.[0];
  }
  public getCity(): string {
    return this.address?.[0]?.city;
  }
  public getPostalCode(): string {
    return this.address?.[0]?.postalCode;
  }
  public getTelephone(): string {
    const phone = find(this.telecom, ['system', 'phone']);
    return phone?.value;
  }
  public getWebsite(): string {
    const website = find(this.telecom, ['system', 'url']);
    return website?.value;
  }
}
