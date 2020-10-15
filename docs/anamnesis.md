# Managing the medical history of users with the SDK

- [Managing the medical history of users with the SDK](#managing-the-medical-history-of-users-with-the-sdk)
  - [About the medical history](#about-the-medical-history)
  - [FHIR implementation](#fhir-implementation)
  - [Example: Patient resource](#example-patient-resource)
    - [Fetching information](#fetching-information)
    - [Updating an existing Patient resource](#updating-an-existing-patient-resource)
    - [Creating a new Patient resource](#creating-a-new-patient-resource)
  - [Example: Questionnaire and QuestionnaireResponse resources](#example-questionnaire-and-questionnaireresponse-resources)
    - [Fetching information](#fetching-information-1)
    - [Updating information](#updating-information)
    - [Creating resources](#creating-resources)
  - [Other resources](#other-resources)


## About the medical history
Data4Life implementations can feature a questionnaire about a user's _medical history_, also called anamnesis or health history (German: medizinische Vorgeschichte, Anamnese). The questionnaire contains questions about the medial history of a person. The information is usually entered at the beginning of the user journey. For example, the medical history contains information about the following for a person:
- Personal data
- Conditions and diagnoses
- Risk factors
- Allergies
- Emergency contacts

## FHIR implementation
The Fast Healthcare Interoperability Resources (FHIR) standard is missing a special `medical history` resource. Instead, information is stored in different FHIR resources, depending on the type of information, and marked with a medical history identifier where needed:
- `Patient` resource for information contained in the [Patient](https://www.hl7.org/fhir/patient.html) resource, such as name and biological sex.
- `Questionnaire` and `QuestionnaireResponse` resources for custom questions that can't be mapped to an existing FHIR resource or where additional specifications would be required for FHIR compliance.
See ['when to use questionnaires'](#when-to-use-questionnaires).
- `Observation` resource for specific data points that can be mapped to [Observations](https://www.hl7.org/fhir/observation.html), such as a patient's body height and weight. _Not in use at the moment._

Application integrators can display an overview of a patient's medical history or display data like a doctor's form. With the help of the SDK, you can customize the aggregation and display of these resources as a coherent `medical history` section.

The SDK passes through any valid FHIR resource sent to the SDK, not restricted to the ones mentioned above. The current approach is to use minimal number of attributes that the respective FHIR resource or an application design requires.
You can provide additional information as long as it is valid FHIR. But it will not be displayed in Data4Life apps and might be lost when the provided resources are updated through an application other than your client.


## Example: Patient resource

Currently it is assumed that the first stored `Patient` resource contains the relevant data.
Other instances are not considered for fetching and writing medical history data.

### Fetching information

A good place to start is by fetching the stored patient information.

```javascript
 const patientResource = await D4L.SDK.fetchResources(userId, {
    resourceType: 'Patient'
  });

  // In the future, patient management resource will be managed more strictly by the app.
  if (patientResource && patientResource.records && patientResource.records.length) {
    const patient = patientResource.records[0];

    // All actual data is stored in the fhirResource
    const patientResource = patient['fhirResource'];
  }

```

### Updating an existing Patient resource

A questionnaire in your app might ask users to update information. The `updateResource` method lets you send the update to the SDK.

A questionnaire in your application might ask the patient to update information, which you can send to the SDK as shown below.

```javascript

const userId = D4L.SDK.getCurrentUserId();

 // This could mean retrieving the information from your store
 const thePatient = {
     ...getCurrentPatientResource() // When updating information, avoid using a reference to your stored version
 };

thePatient.birthDate = document.getElementById('birthDate').value;

D4L.SDK.updateResource(userId, thePatient); // Returns a promise with the new record which you could use to update your store
```

### Creating a new Patient resource
Below is a sample implementation for how an application creates a new patient resource by using the `createRecource` method.

**Note**: Patient resources created by clients other than Data4Life are not processed by Data4Life apps.

```javascript

const userId = D4L.SDK.getCurrentUserId();

const thePatient = { // The basic set of information for every patient
    resourceType: 'Patient',
    active: true,
    deceasedBoolean: false
  };

thePatient.gender = document.getElementById('gender').value;
thePatient.birthDate = document.getElementById('birthDate').value;
thePatient.name = [{
    use: 'usual',
    'given': [document.getElementById('givenName').value], // Array format
    'family': document.getElementById('familyName').value,
}];

D4L.SDK.createResource(userId, thePatient); // Note: returns a promise with the created record which you could store
```


## Example: Questionnaire and QuestionnaireResponse resources

Currently it is assumed that the first stored `Questionnaire` resource with a `title`  and the first stored `QuestionnaireResponse` with an `identifier` of 'Anamnesis Questionnaire - custom questions' is the correct one.

**Note**: The `Questionnaire` resource only contains the questions, whereas all answers are stored in the `QuestionnaireResponse` resource. Questions and their answers are linked through their `linkId` property.

### Fetching information

```javascript
const userId = D4L.SDK.getCurrentUserId();
let questionId; // In this example, we find the first question and its answer

const questionnaireResource = await D4L.SDK.fetchResources(userId, {
    resourceType: 'Questionnaire'
});

if (questionnaireResource && questionnaireResource.records && questionnaireResource.records.length) {
    const questionnaireRecords = questionnaireResource.records.map(
        record => record['fhirResource']
      );

    // Find a questionnaire with the medical history title
    const anamnesisQuestionnaire =
        questionnaireRecords.find(questionnaire => questionnaire.title === 'Anamnesis')

    // Example for finding a question
    if (anamnesisQuestionnaire) {
        questionId = anamnesisQuestionnaire.item[0].linkId;
    }

}

const questionnaireResponseResource = await D4L.SDK.fetchResources(userId, {
    resourceType: 'QuestionnaireResponse'
});

if (questionnaireResponseResource && questionnaireResponseResource.records && questionnaireResponseResource.records.length) {
    const questionnaireResponseRecords = questionnaireResponseResource.records.map(
            record => record['fhirResource']
          );

    // Find a questionnaireResponse whose reference is the questionnaire's id
    const anamnesisQuestionnaireResponse =
        questionnaireResponseRecords.find(response => response.reference === anamnesisQuestionnaire.id)

    // Iterate through the `item` to find answers
    if (anamnesisQuestionnaireResponse) {
        const storedResponse = anamnesisQuestionnaireResponse.item.find(item => item.linkId === questionId);
    }
}

```

### Updating information

Updates to the `Questionnaire` resource are only required when a question is added that has previously been unanswered. To add a question item:

```javascript

function addQuestionToQuestionnaire(question) {
    const userId = D4L.SDK.getCurrentUserId();

     // This could mean retrieving it from your store
    const theQuestionnaire = {
        ...getCurrentQuestionnaire() // Use object spread or other means to prevent mutation of stored questionnaire
    };

    const questionItem = {
        linkId: question.identifier,
        identifier: question.identifier,
      };

    theQuestionnaire.fhirResource.item = [...theQuestionnaire.fhirResource.item, questionItem];

    return D4L.SDK.updateResource(userId, theQuestionnaire.fhirResource); // A promise that returns the new value
}

```

New or changed answers require an update to the `QuestionnaireResponse` object. To implement the object update:
```javascript
function addQuestionAnswerToQuestionnaireResponse(response) {
    const userId = D4L.SDK.getCurrentUserId();

     // This could mean retrieving it from your store
    const theQuestionnaireResponse = {
        ...getCurrentQuestionnaireResponse() // Use object spread or other means to prevent mutation of stored questionnaireResponse
    };

    const answerItem = {
        linkId: response.identifier,
        identifier: response.identifier,
        valueBoolean: [response.value], // FHIR QuestionnaireResponse requires an array
      };

    // A response might be a change of an already-existing answer
    const answerInExistingItemsIndex = theQuestionnaireResponse.fhirResource.item.findIndex(
          existingAnswer => existingAnswer.linkId === answerItem.linkId
    );

    // Add new responses to item prop, update existing responses
    if (answerInExistingItemsIndex !== -1) {
        questionnaireResponse.fhirResource.item[answerInExistingItems] = answerItem;
    } else {
        questionnaireResponse.fhirResource.item.push(answerItem);
    }

    // A promise that returns the updated resource
    return D4L.SDK.updateResource(userId, questionnaireResponse.fhirResource);
}

```

### Creating resources

The SDK allows the creation of `Questionnaire` and `QuestionnaireResponse` objects. The objects must be valid FHIR resources.

**IMPORTANT:** To ensure compatibility, third-party providers should contact Data4Life before creating their own medical history questionnaires.

To create the resources:

```javascript
function createQuestionnaireAndAddQuestion(question) {
    const userId = D4L.SDK.getCurrentUserId();

    const questionItem = {
        linkId: question.identifier,
        type: question.type,
        identifier: question.identifier,
        readOnly: false,
        repeats: false
    };

    const newQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Anamnesis',
        status: 'active',
        subjectType: ['Patient'],
        item: [questionItem]
    };

    return D4L.SDK.updateResource(userId, newQuestionnaire); // A promise that returns the new value
}

```

```javascript
function createQuestionnaireResponseAndAddResponse(response) {
    const userId = D4L.SDK.getCurrentUserId();

    const answerItem = {
        linkId: response.identifier,
        type: response.type,
        identifier: response.identifier,
        valueBoolean: [response.value], // Questionnaire response requires an array
    };

    const questionnaireRecord = getCurrentQuestionnaireRecord(); // Retrieve from your store

    const newQuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        identifier: 'Anamnesis',
        status: 'in-progress',
        item: [answerItem],
        questionnaire: {
            reference: questionnaireRecord.id,
        },
    };

    return D4L.SDK.updateResource(userId, newQuestionnaireResponse); // A promise that returns the new value
}

```

## Other resources
Support for other resources is currently not implemented.
