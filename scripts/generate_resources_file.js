const { readdirSync, statSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const { getFiles } = require('./utils.js');

const getVariableName = path =>
  path
    .split('/')
    [path.split('/').length - 1].split(/-|\./)
    .slice(0, -1)
    .map(word => word.charAt(0).toUpperCase() + word.substring(1))
    .join('');

const getReferencePath = path => path.split('/').slice(-1)[0];

function generateResourcesFile(inputDir, outputFile) {
  const files = getFiles(inputDir);
  let code = '';
  files.forEach(file => {
    const variableName = getVariableName(file);
    code = `${code}import ${variableName} from './${
      inputDir.split('/').slice(-1)[0]
    }/${getReferencePath(file)}';\n`;
  });
  code = `${code}\nexport default {\n`;
  files.forEach(file => {
    const variableName = getVariableName(file);
    code = `${code}  ${variableName},\n`;
  });
  code = `${code}};\n`;

  writeFileSync(outputFile, code);
}

generateResourcesFile(
  `${__dirname}/../test/lib/resources/stu3/resourcetype`,
  `${__dirname}/../test/lib/resources/stu3/resourcetype-examples.js`
);

module.exports = { generateResourcesFile };
