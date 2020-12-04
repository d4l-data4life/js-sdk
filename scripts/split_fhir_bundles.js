const { getFiles } = require('./utils.js');
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');

function getResourcesFromBundle(bundle) {
  return bundle.entry.map(entry => entry.resource);
}

function splitBundleToResources(inputFile, outputDir) {
  if (!existsSync(outputDir)) mkdirSync(outputDir);

  const bundle = JSON.parse(readFileSync(inputFile));
  const resources = getResourcesFromBundle(bundle);
  resources.forEach(resource =>
    writeFileSync(
      `${outputDir}/${resource.resourceType}-${resource.id}.json`,
      JSON.stringify(resource, null, 2)
    )
  );
}

splitBundleToResources(
  `${__dirname}/../test/lib/resources/r4/bundles/bundlefile.json`,
  `${__dirname}/../test/lib/resources/r4/resourcetype/`
);

module.exports = { splitBundleToResources };
