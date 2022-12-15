const { existsSync, readFileSync, writeFileSync } = require('node:fs');

const defaultPatchesList = JSON.stringify(
  {
    packages: []
  },
  null,
  2
);

function createRemembererFile() {
  writeFileSync('includedPatchesList.json', defaultPatchesList);
}

/**
 * @param {string} pkgName
 * @returns {Record<string, any>}
 */
function getPatchesList(pkgName) {
  const patchesList = JSON.parse(
    readFileSync('includedPatchesList.json', 'utf8')
  );

  const package = patchesList.packages.find(
    (package) => package.name === pkgName
  );

  if (!package) {
    return [];
  } else {
    return package.patches;
  }
}

/**
 * @param {string} packageName
 * @param {Record<string, any>} patches
 */
function writePatches({ packageName }, patches) {
  if (!existsSync('includedPatchesList.json')) {
    createRemembererFile();
  }

  const patchesList = JSON.parse(
    readFileSync('includedPatchesList.json', 'utf8')
  );

  const index = patchesList.packages.findIndex(
    (package) => package.name === packageName
  );

  if (index === -1) {
    patchesList.packages.push({
      name: packageName,
      patches
    });
  } else patchesList.packages[index].patches = patches;

  writeFileSync(
    'includedPatchesList.json',
    JSON.stringify(patchesList, null, 2)
  );
}

/**
 * @param {string} pkgName
 */
function getPatchList(pkgName) {
  if (!existsSync('includedPatchesList.json')) {
    createRemembererFile();

    return [];
  } else return getPatchesList(pkgName);
}

module.exports = {
  getPatchList,
  writePatches
};
