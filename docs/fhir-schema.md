# Working with FHIR schemas
The schemas in the _/fhir/_ folders are fetched from the [official FHIR Page](https://www.hl7.org/fhir/fhir.schema.json.zip).
[fhir.schema.v301.json](fhir/stu3/fhir.schema.v301.json) and [fhir.schema.v401.json](fhir/r4/fhir.schema.v401.json) contain the combined schema with minor changes.\
For the implementation, data4life had to change the `oneOf` keyword in `ResourceList` to `anyOf` because otherwise the validator fails. The minimal `Practitioner` resource, for example, is accepted by multiple of the schemas referenced in `ResourceList`. Therefore, the validation would fail. Those changes have already been proposed to HL7. \
data4life migrated the schema to [draft-06](http://json-schema.org/draft-04/schema#). Therefore, we only had to remove the schema property from the JSON. \
[fhir.schema.v301.min.json](fhir/fhir.schema.v301.min.json) is the same schema as in [fhir.schema.v301.json](fhir/fhir.schema.v301.json) but with reduced size. To achieve this, we removed the description properties and all the spaces and line breaks.
