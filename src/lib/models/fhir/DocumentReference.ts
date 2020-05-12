import find from 'lodash/find';
import map from 'lodash/map';

import Attachment from './Attachment';
import { getResource } from './helper';
import Practitioner from './Practitioner';

interface DocumentReferenceConstructor {
  // attachments is mandatory
  id?: string;
  attachments: Attachment[];
  type?: fhir.CodeableConcept;
  title?: string;
  creationDate?: Date;
  author?: Practitioner;
  additionalIds?: Object;
  practiceSpecialty?: fhir.CodeableConcept;
}

export const DOCUMENT_REFERENCE = 'DocumentReference';

export default class DocumentReference implements fhir.DocumentReference {
  // this method can be utilised to use all the helper methods provided in class.
  // here we copy the properties from fhir object which are supported in our class.
  // tslint:disable-next-line variable-name
  public static fromFHIRObject(FHIRObject: fhir.DocumentReference): DocumentReference {
    if (!FHIRObject) {
      throw new Error(
        'DocumentReference.fromFHIRObject requires 1 argument of type fhir DocumentReference.'
      );
    }

    const documentReference = new DocumentReference({ attachments: [] });

    documentReference.resourceType = FHIRObject.resourceType;
    documentReference.indexed = FHIRObject.indexed;
    documentReference.status = FHIRObject.status;
    documentReference.type = FHIRObject.type;
    documentReference.author = FHIRObject.author;
    documentReference.description = FHIRObject.description;
    documentReference.subject = FHIRObject.subject;
    documentReference.content = FHIRObject.content;
    documentReference.identifier = FHIRObject.identifier;
    documentReference.contained = FHIRObject.contained;
    documentReference.context = FHIRObject.context;
    documentReference.id = FHIRObject.id;

    return documentReference;
  }
  public resourceType: string;
  public id: string;
  public indexed: fhir.instant;
  public status: fhir.code;
  public type: fhir.CodeableConcept;
  public author?: fhir.Reference[];
  public description?: string;
  public subject?: fhir.Reference;
  public content: fhir.DocumentReferenceContent[];
  public context?: fhir.DocumentReferenceContext;
  public identifier?: fhir.Identifier[];
  public contained: any[];
  constructor({
    id,
    attachments,
    type,
    title,
    creationDate,
    author,
    additionalIds,
    practiceSpecialty,
  }: DocumentReferenceConstructor) {
    this.resourceType = DOCUMENT_REFERENCE;
    this.status = 'current';
    this.type = type;
    this.author = [{ reference: '#contained-author-id' }];
    this.description = title;
    this.subject = { reference: title };
    this.contained = [];

    if (id) {
      this.id = id;
    }
    // todo: PHDP-403 warn/reject if DocumentReference will not have indexed prop
    if (creationDate) {
      this.indexed = creationDate.toISOString();
    }
    if (attachments) {
      this.content = attachments.map(attachment => ({ attachment }));
    }
    if (author) {
      this.contained.push({
        ...author,
        id: 'contained-author-id',
      });
    }
    if (practiceSpecialty) {
      this.context = { practiceSetting: practiceSpecialty };
    }
    if (additionalIds) {
      this.identifier = Object.keys(additionalIds).map(key => ({
        assigner: {
          reference: key,
        },
        value: additionalIds[key],
      }));
    }
    return this;
  }

  public setAdditionalIdForClient(partnerId: string, customId: string) {
    const id = find(this.identifier, { assigner: { reference: partnerId } });
    this.identifier = this.identifier || [];
    if (id) {
      id.value = customId;
    } else {
      this.identifier.push({
        assigner: {
          reference: partnerId,
        },
        value: customId,
      });
    }
  }

  public getAdditionalIdForClient(partnerId: string): string {
    const customId = find(this.identifier, {
      assigner: { reference: partnerId },
    });
    return customId?.value;
  }

  public getTitle(): string {
    return this.description;
  }
  public getType(): fhir.CodeableConcept {
    return this.type;
  }
  public getAttachments(): fhir.Attachment[] {
    return this.content ? map(this.content, 'attachment') : [];
  }
  public setAttachments(attachments: fhir.Attachment[]) {
    this.content = attachments.map(attachment => ({ attachment }));
  }

  public getPracticeSpecialty(): fhir.CodeableConcept {
    return this.context?.practiceSetting;
  }
  // author can be Practitioner or Organisation
  // TODO handle organisation
  public getAuthor() {
    const practitionerFhir = getResource(this.author[0], this.contained);
    return practitionerFhir
      ? (Practitioner.fromFHIRObject(practitionerFhir) as fhir.Practitioner)
      : undefined;
  }

  public getPractitioner(): Practitioner {
    const practitioner = this.getAuthor();
    return practitioner ? Practitioner.fromFHIRObject(this.getAuthor()) : undefined;
  }
}
