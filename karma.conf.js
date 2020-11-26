module.exports = config => {
  const configuration = {
    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/lib/fileValidator/fileSamples/*', included: false, served: true },
      { pattern: 'test/lib/resources/*', included: false, served: true },
      { pattern: 'fhir/*', included: false, served: true },
      'src/**/*.ts',
      'test/**/*.ts',
    ],

    preprocessors: {
      'src/**/*.ts': ['karma-typescript'],
      'test/**/*.ts': ['karma-typescript'],
    },

    client: {
      node: config.node,
    },

    proxies: {
      '/fileSamples/': '/base/test/lib/fileValidator/fileSamples/',
    },

    karmaTypescriptConfig: {
      compilerOptions: {
        module: 'commonjs',
      },
      tsconfig: './tsconfig.test.json',
      bundlerOptions: {
        transforms: [
          require('karma-typescript-es6-transform')({
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'not ie >0', 'not op_mini all'],
                  },
                },
              ],
            ],
          }),
        ],
      },
    },
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon', 'karma-typescript'],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],

    coverageReporter: {
      reporters: [{ type: 'lcov' }],
    },

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],
  };

  config.set(configuration);
};
