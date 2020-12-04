const { readdirSync, statSync, writeFileSync } = require('fs');
const { resolve } = require('path');

function getFiles(dirname) {
  let files = [];
  readdirSync(dirname).forEach(dirContent => {
    const contentPath = resolve(dirname, dirContent);
    const contentStat = statSync(contentPath);
    if (contentStat.isDirectory()) {
      const dirFiles = getFiles(`${dirname}/${dirContent}`);
      files = [...files, ...dirFiles];
    } else {
      files.push(contentPath);
    }
  });
  return files;
}

module.exports = { getFiles };
