module.exports = config => {
  const configuration = {
    // list of files / patterns to load in the browser
    files: [
      'test/testUtils/globalResources.js',
      'src/**/*.js',
      'src/**/*.ts',
      'test/**/*.js',
      { pattern: 'test/lib/fileValidator/fileSamples/*', included: false, served: true },
    ],

    preprocessors: {
      'src/**/*.js': ['browserify'],
      'src/**/*.ts': ['browserify'],
      'test/**/*.js': ['browserify'],
    },
    client: {
      node: config.node,
    },

    proxies: {
      '/fileSamples/': '/base/test/lib/fileValidator/fileSamples/',
    },

    browserify: {
      verbose: true,
      output: './',
      debug: true,
      plugin: [
        'proxyquire-universal',
        [
          'tsify',
          {
            project: 'tsconfig.json',
          },
        ],
      ],
      transform: [
        [
          'babelify',
          {
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
            extensions: ['.ts', '.js'],
            plugins: ['dynamic-import-node', '@babel/plugin-proposal-object-rest-spread', 'lodash'],
            env: {
              test: {
                plugins: ['istanbul'],
              },
            },
          },
        ],
        [
          'aliasify',
          {
            aliases: {
              config: './src/config/index',
            },
          },
        ],
      ],
    },
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon', 'browserify'],

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
