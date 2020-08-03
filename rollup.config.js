import cleaner from 'rollup-plugin-cleaner';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { terser } from 'rollup-plugin-terser';

import process from 'process';
import { writeFileSync, readFileSync } from 'fs';
import packageJson from './package.json';

const { env, argv } = process;
const VERSION = env.VERSION || packageJson.version;
const config = argv
  .filter(arg => arg.includes('--config-'))
  .map(arg =>
    arg
      .split('--config-')
      .pop()
      .split('=')
  )
  .reduce((args, arg) => ({ ...args, [arg[0]]: arg[1] }), {});

const format = config.format || 'es';
global.console.log(`Building SDK version ${VERSION} (format: ${format}) ...`);

export default {
  input: config.sdk === 'crypto' ? `${__dirname}/src/d4l-crypto.js` : `${__dirname}/src/d4l.js`,
  output: [
    {
      dir: `${__dirname}/dest`,
      // file: config.sdk === 'crypto' ? 'd4l_sdk_crypto.js' : 'd4l_sdk.js',
      format,
      sourcemap: config.mode !== 'production' || format !== 'es',
      banner: `/*! Version: ${JSON.stringify(VERSION)}${
        VERSION === 'nightly' ? ` (${packageJson.version})` : ''
      } */`,
      name: 'D4L-SDK',
    },
  ],
  plugins: [
    cleaner({
      targets: [`${__dirname}/dest`],
    }),
    replace({
      __DATA_MODEL_VERSION__: packageJson.D4L.data_model_version,
      __VERSION__: `'${VERSION}'`,
    }),
    resolve({
      preferBuiltins: true,
      browser: true,
    }),
    commonjs({
      namedExports: {
        'node_modules/js-crypto': [
          'deriveKey',
          'importKey',
          'generateAsymKeyPair',
          'symDecrypt',
          'asymDecryptString',
          'symDecryptObject',
          'symEncryptObject',
          'symDecryptString',
          'symEncryptString',
          'asymEncryptString',
          'symEncryptBlob',
          'generateSymKey',
          'keyTypes',
          'convertBlobToArrayBufferView',
          'convertArrayBufferViewToString',
          'convertArrayBufferViewToBase64',
          'convertBase64ToArrayBufferView',
          'convertStringToArrayBufferView',
        ],
      },
    }),
    nodePolyfills(),
    json(),
    typescript(),
    terser(),
    {
      name: 'generatePackageJson',
      writeBundle() {
        const contents = { ...packageJson };
        delete contents.scripts;
        delete contents.dependencies;
        delete contents.devDependencies;
        contents.module = './d4l.js';
        contents.main = './d4l.js';
        writeFileSync(`${__dirname}/dest/package.json`, JSON.stringify(contents, null, 2));
        writeFileSync(
          `${__dirname}/dest/README.md`,
          readFileSync(`${__dirname}/README.md`, 'utf8')
        );
      },
    },
  ],
};
