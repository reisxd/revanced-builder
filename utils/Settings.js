const { existsSync, readFileSync, writeFileSync } = require('node:fs');

const defaultSettings = {
  sources: {
    patches: 'revanced/revanced-patches',
    integrations: 'revanced/revanced-integrations'
  },
  patches: []
};
const defaultSettingsJSON = JSON.stringify(defaultSettings, null, 2);

function createSettingsFile() {
  writeFileSync('settings.json', defaultSettingsJSON);
}

/**
 * @param {string} pkgName
 * @returns {Record<string, any>}
 */
function getPatchesList(pkgName) {
  const patchesList = JSON.parse(readFileSync('settings.json', 'utf8'));

  const package = patchesList.patches.find(
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
  if (!existsSync('settings.json')) {
    createSettingsFile();
  }

  const patchesList = JSON.parse(readFileSync('settings.json', 'utf8'));

  const index = patchesList.patches.findIndex(
    (package) => package.name === packageName
  );

  if (index === -1) {
    patchesList.patches.push({
      name: packageName,
      patches
    });
  } else patchesList.patches[index].patches = patches;

  writeFileSync('settings.json', JSON.stringify(patchesList, null, 2));
}

/**
 * @param {string} pkgName
 */
function getPatchList(pkgName) {
  if (!existsSync('settings.json')) {
    createSettingsFile();

    return [];
  } else return getPatchesList(pkgName);
}

function getSettings() {
  const settings = JSON.parse(readFileSync('settings.json', 'utf8'));

  return settings;
}

function writeSources(sources) {
  const settings = JSON.parse(readFileSync('settings.json', 'utf8'));

  settings.sources = sources;

  writeFileSync('settings.json', JSON.stringify(settings, null, 2));
}

function getSources() {
  if (!existsSync('settings.json')) {
    createSettingsFile();

    return defaultSettings.sources;
  } else return getSettings().sources;
}

module.exports = {
  getPatchList,
  writePatches,
  getSources,
  writeSources
};
