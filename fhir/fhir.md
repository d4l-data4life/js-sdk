# Adding FHIR resources

The JS-SDK validates any uploaded FHIR resource based on its official FHIR JSON schema.

While the validation itself happens during runtime, the validation function per resource type needs to be generated before. All other solutions, such as the popular libraries AJV or DJV, require a form of "eval" for their runtime function construction which we consider unsafe.

## Adding the schema for a new resource type

The FHIR schema file requires both the definition for the resource you actually want to add and any resources used, referenced or extended by it.

To make this easy, we recommend basing a new schema on the existing file for documentreference because it contains a reasonable base amount of auxilliary definitions.

Save a new json file based on the documentreference file with your resource type as the file name. In line 4, change the value from of the $ref to the name of your resource type, for example `"$ref": "#/definitions/MedicalPlan"` if you want to add support for MedicalPlan.definitions. Do the same for "ResourceList" definition, which is the last one before the resource type.

Now go the "fhir.schema.v301.json" and find the definition of the resource type you want to add. Copy the entire JSON branch and replace the existing "DocumentReference" branch with it.

Depending on the complexity of your resource, you will need additional types that are referenced in your type. For DocumentReference, this is "DocumentReference_RelatesTo", "DocumentReference_Content", "DocumentReference_Context" and "DocumentReference_Related". Delete these branches and replace them with the ones you need. If you do not know whether you need additional resources, proceed to the next step as the tool will tell you about any missing definitions.

## Compile the schema into a javascript function

On the terminal inside the `fhir` directory, run

```npx ajv compile -s fhir-careplan.schema.v301.json -0 careplan.js```

to compile the modified JSON file into a javascript file.

If you are missing any definitions from the previous step, ajv will tell you about them with a message `error: can't resolve reference`. Fix those until the message you get is `schema is valid`.

## Modify the javascript file

Two small modifications are required for the integration of the javascript file.

1. On the last line (it starts with `module.exports`), replace the content with `export default validate;`.

2. Find the line `message: 'should be equal to constant'`. Exactly ten lines above, set the result of `var schema1 =` to your resource type (such as CarePlan) instead of the long JSON path.

3. Delete the property validate.schema and all its JSON structure. They are not actually needed for the validation.

## Add the javascript file to the javascript

Add the JSON and JS files to the repository. In the file `fhirValidator.js`, add support  for the resource type by copying and adapting an `if (resourceType ===)` block inside `getValidator`. In `helper.ts`, add the new resource type to the `SUPPORTED_RESOURCES` array.

## Run unbabel the javascript file

"Lebab" is "babel" but the other way around. Therefore it transforms es5 into es6.

1. Run `npm run lebab-fhir`

2. lebab might miss a `require`. Therefore in the new file change `var formats = require('ajv/lib/compile/formats')();` to `import formatsFn from 'ajv/lib/compile/formats';` and add `const formats = formatsFn();`.
