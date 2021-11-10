# The Data4Life web SDK
The Data4Life JavaScript web SDK lets you store and access user health data on the Data4Life Personal Health Data Platform (PHDP). You can share PHDP data between users and applications.

For more information about the Data4Life platform, visit [d4l.io](https://www.d4l.io/).

## Before you get started
To use the SDK, you must have a data4life client ID. To obtain a client ID, get in touch with us at contact@data4life.care.

## Using the SDK
Once you have a client ID, follow these steps to start working with the SDK:
1.  Use 'hc-sdk-js' npm package.

```   bash
npm install hc-sdk-js
```

You can then import the named export `D4LSDK` wherever you need it. It is an object with all the methods as properties.

It is also possible to build the SDK yourself Read more about building the SDK in the README.md file.

2. To log in a user, implement the OAuth 2.0 code grant flow which redirects the user to the Data4Life web app for login.
Thereby, you must also create an asymmetric key pair by calling `D4L.SDK.createCAP`. The public key of the user must be sent to our backend, while the private key needs to be stored in your OAuth backend.

To revoke the received refresh token, post to '/oauth/revoke' with the refresh token as a parameter.

1. To initialize the SDK by providing your client ID:
```javascript
    D4L.SDK.setup({
        clientId,               // clientId of the application that uses the SDK
        environment,            // The environment the SDK should run in. The options are 'development' and 'production'
        privateKey,             // Private key of the logged-in user
        requestAccessToken,     // Callback for requesting a valid access token
        extendedEnvConfig,     // additional environment configuration options
        fhirVersion
        });
```

4. The following methods are available:
    - [createCAP](#createCAP)
    - [sealCAP](#sealCAP)
    - [reset](#reset)
    - [getCurrentUserId](#getCurrentUserId)
    - [getCurrentAppId](#getCurrentAppId)
    - [grantPermission](#grantPermission)
    - [getReceivedPermissions](#getReceivedPermissions)
    - [isAllowedFileType](#isAllowedFileType)

    - [updateDocument](#updateDocument)

    - [createResource](#createResource)
    - [fetchResource](#fetchResource)
    - [updateResource](#updateResource)
    - [deleteResource](#deleteResource)
    - [fetchResources](#fetchResources)
    - [downloadResource](#downloadResource)
    - [countResources](#countResources)

## SDK methods for document management

The following section describes the methods provided by the SDK.

### getCurrentUserId
To return the ID of the logged-in user, synchronously call the `getCurrentUserId` method.

#### Parameters
This method has no parameters.

#### Returns
| Property | Type | Description |
|----------|:-----|:------------|
| id | String | The ID of the logged-inuser |

#### Sample call
```javascript
const userId = D4L.SDK.getCurrentUserId();
```

#### Sample response
```javascript
'1cf5ee52-88dc-406a-bf7b-bc5e26a17b47'
```

### grantPermission
To allow other users to access data of the logged-in user, use the `grantPermission` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| appId | String | ID of the application the data should be shared with |
| annotations | [String] | Only records with those annotations are shared |

#### Resolves
This method has no resolves.

#### Sample call
```javascript
D4L.SDK.grantPermission('1cf5ee52-88dc-406a-bf7b-bc5e26a17b47', ['annotation']).then(...)
```

### getReceivedPermissions
To get you information about all permissions you received, use the `getReceivedPermissions` method.

#### Parameters
This method has no parameters.

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| appId | String | App installation ID |
| commonKey | String | Encrypted common key |
| grantee | String | Reference to the grantee user ID (recipient) of this permission |
| granteePublicKey | String | Public key of the grantee |
| id | String | Unique identifier of type UUID of this permission |
| owner | String | Reference to the owning user ID of this permission |
| scope | [String] | Contains the granted tokens |

#### Sample call
```javascript
D4L.SDK.getReceivedPermissions().then(...)
```

#### Sample response
```javascript
{
    appId: '227ca002-db96-4175-9f10-d5ff6745259d',
    commonKey: 'CmqrvHd/Dmi8/b+m4MmjH19vlqfkIAz65Yr4UFZhwtLSGUBQQN2KaFcbRAf/jE/7lsywMqGz3H8dPnezLBnlHuA6D04+tvZupPKGe2YPD7tph8P2S3ujjpG/pq9s8qBRMj9jPZp6642dR7P8vlQcgah4mSNIjh2bMkbzmMTL1+79obUcVvxPUeTXMT1B0Ah65NxzqWrbevC83LgBUjk9+8fwwYXryIPXE7OUG7uj54t6xMIk6UiZfRRCXO4xEDbvTTyOF9mdrXDTgd8o6YYtcGyfKXC9IGv2ZB6tFPChp4wxbnzDkGWDOx5utzYb6rCR+y/YlYXwmjYeRrh0nr1pHw==',
    grantee: 'cf06c003-5f3f-499c-a14f-4868fba3487a',
    granteePublicKey: 'eyJ0IjoiYXB1YiIsInYiOjEsInB1YiI6Ik1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdkNRTGQ3NjNjL3VPTFl4WHFaWkQ5eVcvOFZDTEFQZ29oRFpsNjUvNUpmUzZMeWdBeU5qSDBIUE85MlRNcHl3SmZ5dGVDbGJaQmo0SUJoTlNkL3pUS3NuREY0RmNhY3plQzgxRVZlWUx3SFpGTnJUL2tQUUZuTERNNWYrWUxUVVZHM1JaRUpsblgwSXM2VS82VGdTS1dnYlhnWG9yYW9KT0tjY0pyZG1YemNpbmY4ZGxwc2hEandPV3c1cDM4d1ZqL0E5UXNwUTFZV1MyOXUvc1EyNElmZFh0WXIwcCsxT3JtS0l5TFhJVTBxTEdUNGtBbWprYlZFdUl0YmxlcXJlS25paFhOVTVMSDdXeFJNUEdRQlZKMHNMRGY4M0RVVHFwT3ZUQ0hKVy9JVklUMG5QeSs0WEJtcnVRVEhOQ3g2OFdkclRnb0c1bGQ4U2NNczkwYnBUdDR3SURBUUFCIn0=',
    id: '177cca07-95ce-47e4-968c-2e36d70c87b6',
    owner: 'cf06c003-5f3f-499c-a14f-4868fba3487a',
    scope: ["exc", "perm:r", "perm:w", "rec:r", "rec:w", "attachment:r", "attachment:w", "user:r", "user:w", "user:q"]
}
```

### createCAP

To create an asymmetric key pair that contains a Data4Life-specific version tag, use the `createCAP` method. The result is an object that contains the properties `privateKey` and `publicKey`. The values are cryptographic keys which are stringified, base-64 encoded, and Data4Life-versioned.

**IMPORTANT:** Use the string properties to store the keys in your backend. Don't store those strings in the browser.

To make the strings storable in the browser, use the `sealCAP` method. You can initialize the SDK with the result of the `sealCAP` method.

### sealCAP

The `sealCAP` method imports the custom Data4Life cryptographic key into [the crypto key standard](https://www.w3.org/TR/WebCryptoAPI/#dfn-CryptoKey) in an unexportable way. You can store the object in the IndexedDB and use it to initialize the SDK. This is a safer format than storing exportable cryptographic keys or using the Data4Life cryptographic key format.

#### Parameters
This method has no parameters.

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| publicKey | String | Base 64-encoded public key |
| privateKey | String | Base 64-encoded private key |

#### Sample call
```javascript
D4L.SDK.createCAP()
```
#### Sample response
```javascript
{
    publicKey: "eyJ0IjoiYXB1YiIsInYiOjEsInB1YiI6Ik1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBcnF0aGl6YkJVQVQ5ZHpWZm1sczUvd2RCdnZXc1lNTHNsVXVCalNlVlhFaVNBWEVmdXRzNDN4Ty82S0ZlTnoxV0krUVRhTUFLbTRBdWtxemwxMDEvNExBaFk0RzdIQTBuWnlDLzZidXlpb2w2c2xSZTVyVERBZS9tMEljb0xnVFZzczZsU3lBdFhPcDZOOS9rUUd1dG5JN0FpT2x5YWw0b0g0cVhHRWJjMVh2Kyt4aUJyeUZXM2NDTHcxU1RmWjhTYzFYa2Fmb3UyRVBVc3dXK3ZYZ28waHZQUU91c1JZWWo2UG83aFZPOHFIZk01TUptWE9vWDhPUlNzQTF2WGovSEE1Q254TWN3TUw5dUt6UW03MGZ3dWxwRlM4RFhwNlRmdzJQMUZtQktSR1RxRUcrUGhlc0NVTEI3dWl1cnZtRTAzZXh4bW1zaUdOSFJtKzlEVHZwS0FRSURBUUFCIn0=",
    privateKey: "eyJ0IjoiYXByaXYiLCJ2IjoxLCJwcml2IjoiTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDdXEyR0xOc0ZRQlAxM05WK2FXem4vQjBHKzlheGd3dXlWUzRHTko1VmNTSklCY1IrNjJ6amZFNy9vb1Y0M1BWWWo1Qk5vd0FxYmdDNlNyT1hYVFgvZ3NDRmpnYnNjRFNkbklML3B1N0tLaVhxeVZGN210TU1CNytiUWh5Z3VCTld5enFWTElDMWM2bm8zMytSQWE2MmNqc0NJNlhKcVhpZ2ZpcGNZUnR6VmUvNzdHSUd2SVZiZHdJdkRWSk45bnhKelZlUnAraTdZUTlTekJiNjllQ2pTRzg5QTY2eEZoaVBvK2p1RlU3eW9kOHprd21aYzZoZnc1Rkt3RFc5ZVA4Y0RrS2ZFeHpBd3YyNHJOQ2J2Ui9DNldrVkx3TmVucE4vRFkvVVdZRXBFWk9vUWI0K0Y2d0pRc0h1Nks2dStZVFRkN0hHYWF5SVkwZEdiNzBOTytrb0JBZ01CQUFFQ2dnRUFDcU1rUngxTllONnFRdjFzb09nSHNhalMrbHF0ZTBlK1diU1FvMTh5NjVKVEswNzZMdC9WUGFkUEZpU1JxaUtNVEVEdEQ2dzJXU21td2NiOEhsbTVaOGtYZ2g4RW5VZU55K3d2Zm9BRm9RWG1BNENRNFAyY0xLZUdzbnl3clR0eWVqZTNLRXFXM2ZtU1Q0bk5OWlo1S3d6UE1UeXFVUFpYL04wWFU0MVQ1ZXBUd29IWkNicno5N3RoTGJOTG1hK3VlNUZTaUQ4c3Fkb1BwNndOTkMydHBrZXU3UlVkaXg2YWdMRk9yN2Vzby8rcWZPY1hDZitCb3UzWDYwUC8wM2pXWXhId1JmNXZPV1ZackJrZ2pjOThJREU2aVBadEc5M2xIdzhkaEs3bWdFS0lMTlZOdUU4U2FJdm1Vd1RUVStpU0xmSlN6YnVweDBKcDlrSDRvcHI4MHdLQmdRRHhpcW1oaXVxT3NZc1ZGV2JYMEtvV3JidnBjZ1pJOGxzVXFxT3d5K1RDZWdBaHd0QTFiajhxQWVuOXVraldQeDFqOWhYYXNVZGlCZ2IwZHFQL0l0ZUhoUFVaRFlqWjRDTU8rOHlmNTVDK0RkQUlIaUx3MnJHVi9wL1BSdTVyZUVheTliRjB5WFBOWGdRbUlySndXRklnc1MxN3kza2lEY1BDYnBhTTRkQnhGd0tCZ1FDNUgvdGRQcWJRWWJPN2J5SzZGWDFoYTUrTjVDbVhJV1dYT1VSZ0l4bkc0VWttejJkMnlIajB3SlIzYVlDMGpUcy9wRjhoWHhSaDRxVXJHS3c4YmNldHIyWUgxMGVVdVpMb0U5TmZNOEhPaVpwUzdtc2JoRlRBalJ1dmRlWElxSDcwcVpEbkRWeVMrTlVZRFpIeWRHRXlJM1MxKzl0MjN0d1VLSktBR3E0Y3B3S0JnRVM4YXcxM2xNeEtwZ08zOVc1UkNUWXU5cHkyUUNlZUlHRS9OaG5uekErejNEbS9VTFVEektITnJhTHcwaTEyQkkwZnlKUlZnclRZZGo0M1RQQWNJQzJHbnFFa2d0OU5zMnhlSjVzUnNOVUU1VUNLSXZOYnFOSEFoZ1hjYjVqUnYzektBbGZ6eENxYktKOFpuS0h2NEY5QlRHcEFPeFoveUVlYVpPbHVrWHk5QW9HQUoyekZObjF5UHl5ZmYwcFN4Zmh2cEVDc1VTYUhLUFZtMGtiUzVmcHpzZVFtbFFwVWlYcDJNQUdYWExydU93VmMyZGZpbnBQR0huYUxJRnQzeXNMQ1pKM1hCOUowSHh0S1N2eDE1bTk2VmNiK1E2MGN5Rlp0U2ppQzdlSVkxcHZ6dFowckM5blBua2s1OEk1clI0dzdhdGNjTXVsNU9wNkpsZzF4N2JCQTVqOENnWUVBaU4rMlIrbWlYcmNOTUpLVXlpNDF6QkV4aVBvbjQrVmhxVDgwR1hQRWxsZUpWeUcyYjBJOVZtZzVBRXVaTkZQZmR4UG1mN05LaTJJaTFGZk1ST0JyeEo0TlB5TVVZY2svbGlhT3o4RzNXNFhBVWtHQ2RSK2VJeTlsRGtrNFhHN2E3L21sUkYzR1ZkOGtHcXpUWkVRS2lwV0V1OHUxNzN4WEE4ak1LbURGdmQwPSJ9"
}
```

### sealCAP

Imports the custom Data4Life crypto key into [the crypto key standard](https://www.w3.org/TR/WebCryptoAPI/#dfn-CryptoKey) in an unexportable fashion. The object within the output Promise can be stored in the indexedDB and used to initialize the SDK. It is considered to be a safer format than storing the Data4Life crypto key itself, which is only meant for storing purposes.

#### Sample Call
```javascript
D4L.SDK.sealCAP(privateKey)
```

#### Parameter
| Name | Type | Description |
|------|:-----|:------------|
| privateKey | Object | A base 64-encoded privateKey |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| privateKeyPromise | Promise<Object> | Unexportable CryptoKey within a Promise. |

#### Sample Response
```javascript
Promise<WebCrypto{}>
```


### crypto.encryptString

Uses the logged in users crypto assets to encrypt the input.
Therefore it creates a new dataKey which is then encrypted with the user's commonKey.

#### Sample Call
```javascript
D4L.SDK.crypto.encryptString(plainText)
```

#### Parameter
| Name | Type | Description |
|------|:-----|:------------|
| plainText | String | The string that shall be encrypted. |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| cipherData | Promise<Array> | An array containing the cipherText and the keyInformation that are required for decryption. |
| cD[0] - cipherText | String | Base 64-encoded cipherText. |
| cD[1] - keyInformation | Object | An abject containing the information that are needed to decrypt the cipherText. |

#### Sample Response
```javascript
Promise<["SGVsbG8gV29yZCwgaG93IGFyZSB5b3U/", { commonKeyId, encryptedDataKey }]>
```


### decryptString

Decrypts a string that was previously encrypted by `crypto.encryptString`.

#### Sample Call
```javascript
D4L.SDK.decryptString(keyInformation, cipherText)
```

#### Parameter
| Name | Type | Description |
|------|:-----|:------------|
| keyInformation | Object | KeyInformation, previously returned by `crypto.encryptString` |
| cipherText | String | A base 64-encoded cipherText |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| plainText | Promise<String> | The decrypted cipherText. |

#### Sample Response
```javascript
Promise<"Hello World!">
```


### reset

To reset the SDK, use the `reset` method. Resetting sets all user information, including user ID and `userLanguage`, to `null` and removes all access tokens, including the `masterAccessToken`. Resetting also removes any available private keys, common keys, and app IDs.

#### Sample call
```javascript
    D4L.SDK.reset()
```

### isAllowedFileType
To check the file format of files uploaded to the Data4Life platform, use the `isAllowedFileType` method. The SDK allows the upload of the following file formats to the Data4Life platform:
- JPEG,including JPEG/JFIF
- PNG – Portable Network Graphics
- TIFF – Tagged Image File Format
- DCM – Digital Imaging and Communications in Medicine
- PDF – Portable Document Format

Trying to create resources with another file format fails.

**NOTE:** The file format check looks at a byte sequence in the file at a specific offset. It doesn't rely on the filename extension.

**NOTE:** For a good user experience, check the file format as early as possible.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
|(unnamed parameter)|File|File for which to check the validity |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
|(unnamed single return value)|Boolean|True if the file is allowed, otherwise false|

#### Sample call
```javascript
    D4L.SDK.isAllowedFileType(file).then(...)
```

### createResource
To upload any type of FHIR resource, use the `createResource` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | string | Owner of the resource |
| fhirResource | fhir.DomainResource | FHIR resource to upload |
| annotations | string[] | Custom annotations for the uploaded resource which you can later use for searches |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| Record | Record | The record with the contained FHIR resource |

#### Sample call
```javascript
D4L.SDK.createResource(ownerId, fhirResource, new Date(), ["blood test report", "dr john doe"]).then(...)
```
`fhirResource` can be any kind of FHIR resource. For example, for a medication, the resource
is <https://www.hl7.org/fhir/careplan-example.json.html>.

#### Sample response
```javascript
{
    id: "500b2aa5-2728-48f1-b77b-2cdac113917a",
    fhirResource: {
        id: "500b2aa5-2728-48f1-b77b-2cdac113917a",
        resourceType: "CarePlan",
        status: "active",
        intent: "plan",
        category: [
            {
                text: "Weight management plan"
            }
        ],
    },
    annotations: ["blood test report", "dr john doe"],
    customCreationDate: "2018-05-07T10:09:09.394Z",
    updatedDate: "2018-05-07T10:09:09.394Z",
    partner: "partner_id" // Partner ID from that the record is uploaded. Refers to the apps using the SDK.
}
```

### updateResource
To update any type of FHIR resource, use the `updateResource` method.


#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | string | Owner ID of the resource |
| fhirResource | fhir.DomainResource | FHIR resource to update |
| annotations | string[] | Custom annotations for the resource uploaded which you can later use for searches |


#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| Record | Record | Record with contained FHIR resource |

#### Sample call
```javascript
D4L.SDK.updateResource(ownerId, fhirResource, ["blood test report", "dr john miller"]).then(...)
```
 `fhirResource` is the FHIR resource that was already created on the platform.

 **Note:** Every created FHIR resource has an `id` parameter.

#### Sample response
```javascript
{
    id: "500b2aa5-2728-48f1-b77b-2cdac113917a",
    fhirResource: {
        id: "500b2aa5-2728-48f1-b77b-2cdac113917a",
        resourceType: "CarePlan",
        status: "active",
        intent: "plan",
        category: [
            {
                text: "Weight management plan"
            }
        ],
    },
    annotations: ["blood test report", "dr john miller"],
    customCreationDate: "2018-05-07T10:09:09.394Z",
    updatedDate: "2018-05-07T10:09:09.394Z",
    partner: "partner_id" // Partner ID from which the record is uploaded. Refers to the apps using the SDK.

}
```
### fetchResource
To download FHIR resources you uploaded, use the `fetchResource` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | String | Owner ID of the resource to fetch |
| resourceId | String | ID of the resource to fetch |

#### Returns
| Property | Type | Description |
|----------|:-----|:------------|
| Record | Record | Requested record with contained FHIR resource |

#### Sample call
```javascript
D4L.SDK.fetchResource('1cf5ee52-88dc-406a-bf7b-bc5e26a17b47', '500b2aa5-2728-48f1-b77b-2cdac113917a').then(...)
```

#### Sample response
```javascript
{
    id: "500b2aa5-2728-48f1-b77b-2cdac113917a",
    fhirResource: {
        resourceType: "CarePlan",
        status: "active",
        intent: "plan",
        category: [
            {
                text: "Weight management plan"
            }
        ],
    },
    annotations: ["blood test report", "dr john doe"],
    customCreationDate: "2018-05-07T10:09:09.394Z",
    updatedDate: "2018-05-07T10:09:09.394Z",
    partner: "partner_id"
}
```

### downloadResource
To download documents you uploaded, or other documents that you have access permission for, use the `downloadResource` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | String | Owner ID of the resource to download |
| documentId | String | ID of the resource to download |
| options | Object| (optional) Download options for image sizes (see below) |


##### Options

Lets you specify options for the `downloadResource` method about the size of image resources.
- **imageSize** Fetch the specified version of your resource if it's an image. Supported values are `full` (default), `preview`, and `thumbnail`. The default value is also returned when no image with the requested size is found.


#### Returns
| Property | Type | Description |
|----------|:-----|:------------|
| fhirResource | fhirResource | The requested document |

#### Sample call
```javascript
D4L.SDK.downloadRessource('1cf5ee52-88dc-406a-bf7b-bc5e26a17b47', 'f843456a-81c2-471d-9f55-ae3317171547').then(...)
```

#### Sample response
```javascript
{
    attachments: [{
        file: {},
        title: "Screen Shot 2018-05-03 at 15.40.15.png",
        contentType: "image/png",
        creation: "2018-05-03T13:40:18.190Z",
        id: "219d6639-af8c-4a7c-9df4-15adddd82aa2"
    }],
    type: "Document",
    creationDate: "2018-05-07T10:09:09.394Z",
    title: "title",
    author: { firstName: "Max" },
    id: "f843456a-81c2-471d-9f55-ae3317171547"
}
```

```javascript
{
    annotations: [],
    customCreationDate: "2019-02-14T00:00:00.000Z",
    fhirResource:
    {
        resourceType: "DocumentReference",
        status: "current",
        type:
        {
            coding: [
                {
                    display: "",
                    code: "ECG"
                }
            ]
        },
        author: [
            {
            reference: "#contained-author-id"
            }
        ],
        description: "ECG",
        subject:
        {
            reference: "ECG"
        },
        contained: [
            {
                resourceType: "Practitioner",
                id: "contained-author-id",
                identifier: [],
                name: [
                {
                    family: "Doe",
                    given: ["Jane"],
                    prefix: [],
                    suffix: []
                }
            ],
            address: [
                {
                    city: "",
                    line: [],
                    postalCode: ""
                }
            ],
            telecom: []
            }
        ],
        content: [
            {
                attachment:
                {
                    contentType: "image/png",
                    creation: "2019-02-14T14:09:11.155Z",
                    title: "ECG 2019-02-13 at 13.53.21.png",
                    id:"b51904e8-6556-4ca5-ab68-4db386917576",
                    file:
                        {
                            name: "ECG 2019-02-13 at 13.53.21.png",
                            lastModifiedDate: null
                        }
                    }
                }
            ],
        context:
            {
                practiceSetting: {
                    coding: [
                        {
                            display: "",
                            code: "394612005"
                        }
                    ]
                }
            },
            id: "a50cf592-1b10-4784-9686-4b399513efc3"
        },
        id: "a50cf592-1b10-4784-9686-4b399513efc3",
        partner: "31be119e-3782-4db8-a24a-1490eea27ed3",
        updatedDate: "2019-02-14T13:09:51.492Z"
    }
}
```

### deleteResource
To delete FHIR resources, use the `deleteResource` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | String | Owner ID of the resource to delete  |
| recordId | String | Record ID of the resource to delete |

#### Sample call
```javascript
D4L.SDK.deleteResource('196e897f-c60f-44db-8507-d5f67022a11f', 'f843456a-81c2-471d-9f55-ae3317171547').then(...)
```

### fetchResources
To fetch all FHIR resources you uploaded, use the `fetchResources` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | String | Owner ID of the resource to fetch  |
| options | Object | (optional) Fetching options for resources |

##### Options
Lets you specify options for the `fetchResource` method.

| Name | Type | Description |
|------|:-----|:------------|
| limit | String | (optional, default: 20, maximum 1000) Maximum number of documents to retrieve |
| offset | String | (optional, default: 0) Number of records to skip when retrieving |
| start_date | Date |(optional) Earliest date for which to return records |
| end_date | Date | (optional) Latest date for which to return records |
| start_updated_date | Datetime |(optional) Earliest date for which to return records based on last modification |
| end_updated_date | Datetime | (optional) Latest date for which to return records based on last modification |
| resourceType | String | (optional) Type of requested FHIR resources |
| fhirVersion | String | (optional) The FHIR verion of the resources, for example "4.0.1" |
| partner | String | (optional) ID of the partner the records where uploaded from |
| annotations | (String or String[])[] | (optional) Custom annotations to filter by. Values in an array are combined to <or> |
| exclude_tags | (String or String[])[] | (optional) Don't fetch resources with given tags. Values in an array are combined to <and> |
| include_deleted | Boolean | (optional) Fetch deleted records |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| records | [Records] | List of records containing FHIR resources and metadata |

#### Sample call
```javascript
D4L.SDK.fetchResources('1cf5ee52-88dc-406a-bf7b-bc5e26a17b47', {
    limit: 10,
    offset: 10,
}).then(...)
```

#### Sample response
```javascript
[
    {
        id: "500b2aa5-2728-48f1-b77b-2cdac113917a",
        fhirResource: {
            resourceType: "CarePlan",
            status: "active",
            intent: "plan",
            category: [
                {
                    text: "Weight management plan"
                }
            ],
        },
        annotations: ["blood test report", "dr john doe"],
        customCreationDate: "2018-05-07T10:09:09.394Z",
        updatedDate: "2018-05-07T10:09:09.394Z",
        partner: "partner_id"
    }
]
```

### countResources

To count the FHIR resources you uploaded, use the `countResources` method.

#### Parameters
| Name | Type | Description |
|------|:-----|:------------|
| ownerId | String | Owner ID of the resource to count |
| options | Object | Options |

##### Options
| Name | Type | Description |
|------|:-----|:------------|
| start_date | Date |(optional) Earliest date for which to return records |
| end_date | Date | (optional) Latest date for which to return records |
| start_updated_date | Datetime |(optional) Earliest date for which to return records based on last modification |
| end_updated_date | Datetime | (optional) Latest date for which to return records based on last modification |
| include_deleted | Boolean | (optional) include deleted records |

#### Resolves
| Property | Type | Description |
|----------|:-----|:------------|
| count | Number | Total number of resources on the server that match the search criteria |

#### Sample call
```javascript
D4L.SDK.countResources('1cf5ee52-88dc-406a-bf7b-bc5e26a17b47', {
    start_date: '2017-08-01',
}).then(...)
```

#### Sample response
```javascript
100
```

### Models

The Data4Life platform supports multiple resource types. It is up to integrators to build and supply these, the SDK merely validates supported resources.

Exception: Within an STU3 context, the SDK provides the models below.

#### DocumentReference
To describe a document that's made available to a healthcare system, use the `DocumentReference` resource.
<https://www.hl7.org/implement/standards/fhir/documentreference.html>

You can generate your own `DocumentReference` FHIR resource by using our helper functions.


##### Sample construction

```javascript

let attachment = new Attachment({
    id: 'attachmentId',
    contentType: 'image/png',
    creation: new Date(),
    title: 'John Doe',
});
// You can also create an attachment by using the JS native File Object.
attachment = new Attachment(file)
Note that the supported file types are .pdf, .jpeg, .jpg, .tiff, .png, .dcm
Note that the maximum supported file size is 20 Megabytes.

const type = createCodeableConcept('Radiology Study observation (findings)', '18782-3', 'http://loinc.org');
const practioner = new Practitioner({
    firstName: 'John',
    lastName: 'Miller',
    prefix: 'Dr.',
    suffix: 'Jr.',
    street: 'Liverpool St.',
    city: 'London',
    postalCode: '20439',
    telephone: '915023421456',
    website: 'www.example.com',
});
const practiceSpecialty = createCodeableConcept('RadiologyInterventionalRadiology', '408455009', 'http://loinc.com');
// Note that attachment is the only mandatory parameter for creating a documentreference.
const documentReference = new DocumentReference({
    attachments: [attachment],
    type,
    title: 'John Doe Document',
    customCreationDate: '2018-08-08',
    author: practioner,
    practiceSpecialty,
    id: 'documentId',
});
// You can also set a custom ID for the document uploaded.
documentReference.setAdditionalIdForClient('clientId', 'customId');
customId = documentReference.getAdditionalIdForClient('clientId');

```
The `DocumentReference` resource supports the following helper functions.

| Name | Description |
|------|:------------|
| `setAdditionalIdForClient(clientId: string, customId: string)` | Sets a custom ID corresponding to the document |
| `getAdditionalIdForClient(clientId: string): string` | Gets the custom  ID corresponding to the client ID |
| `getTitle(): string` | Returns the document title
| `getAuthor(): fhir.Practitioner` | Returns the author <https://www.hl7.org/fhir/practitioner.html> of the `DocumentReference` resource |
| `getPractioner(): fhir.Practitioner` | Returns the practitioner who authored the document <https://www.hl7.org/fhir/practitioner.html> |
| `getType(): fhir.CodeableConcept` | Returns the medication request <https://www.hl7.org/fhir/medicationrequest.html> |
| `getAttachments(): fhir.Attachment[]` | Returns the list of attachments in a document |

The `Practitioner` object, which is contained in the `DocumentReference` resource, supports the following helper functions:
- `getFirstName(): string`
- `getLastName(): string`
- `getPrefix(): string`
- `getSuffix(): string`
- `getStreet(): string`
- `getCity(): string`
- `getPostalCode(): string`
- `getTelephone(): string`
- `getWebsite(): string`


##### Attachments

`DocumentReference`, `Patient`, `Practitioner`, `Medication`, `Observation`, `Questionnaire`, `QuestionnaireResponse` objects can contain attachments which may be image files (see above, also see the [isAllowedFileType](#isAllowedFileType) method).

For all image files, the SDK generates previews and thumbnails during creation:

* **Preview** is a JPEG file that's 1000 pixels in height and is proportionally scaled. When the original image is less than 1001 pixels in height, the preview equals the original image.
* **Thumbnail** is a JPEG file that's 200 pixels in height and is proportionally scaled. When the original image is less than 201 pixels in height, the thumbnail equals the original image.

The versions can be downloaded directly (see [downloadResource](#downloadResource)).

