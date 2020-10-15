<p>
  <a href="https://gitmoji.carloscuesta.me">
    <img src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square" alt="Gitmoji">
  </a>
</p>

# Data4Life Web SDK

This is the Javascript Web SDK of Data4Life, which encapsulates the backend functionality of the platform and enables end-to-end encryption of patient data. It allows users to store sensitive health data on the secure Data4Life platform and share it to authorized people and applications.

For more information about the platform please visit our [website](http://www.data4life.care/).

For more information about using the endpoints and methods provided by the SDK, read the documents in the `docs` folder in this repository.

## Requirements

To use the SDK, you need to create a client id from Data4Life. Please get in touch with us at info@data4life.care.

## Development and build

### Prerequisites

- node, npm

In the directory run:

```bash
npm install
```

### Building
This SDK uses rollup for its bundling task.
Building the SDK bundle is done with:

```bash
 npm run build
```

### Watching

During development, you can let rollup watch for file changes and rebuild your bundle using:

```bash
npm run watch
```

Import the built file in your project to start using the SDK.

## Tests

The SDK uses karma, mocha, sinon, and chai for unit tests.

To run all tests, execute:

```bash
npm test
```

It uses eslint to check and report incorrect indentations and patterns in the project, bundles the project, run unit tests and makes a coverage report.

To run the unit tests only, execute:

```bash
npm run karma:prod:web
```

During development, you can watch for any file changes and rerun the tests on any change using:

```bash
npm run karma:web
```

To run eslint execute:

```bash
npm run lint
```

## Development Process

### Branches

Use the naming convention below for branches:
`<github-username>/<do-this>`

### Releases

Releases are automatically created when the version in the `package.json` is increased. Afterwards the release notes needs to be added manually.

## License

(c) 2020 D4L Data4Life gGmbH / All rights reserved. Please refer to our [License](./LICENSE) for further details.

## Code of conduct

[Contributor Code of Conduct](./CODE-OF-CONDUCT.md). By participating in this project, you agree to abide by its terms.

## Work in progress

This document is still a work in progress. We are working on adding contributing guidelines and other documents.
