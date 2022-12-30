const { writePatches } = require('../utils/Settings.js');

/**
 * @param {Record<string, any>} message
 */
module.exports = function selectPatches(message) {
  global.jarNames.patches = '';

  writePatches(global.jarNames.selectedApp, message.selectedPatches);

  /** @type {string[]} */
  const includedPatchesArray = [];
  let isFirstElement = true;

  for (const patch of message.selectedPatches) {
    const patchName = patch.replace(/\|.+$/, '').replace(/\s/g, '');

    includedPatchesArray.push(patchName);

    if (isFirstElement) {
      global.jarNames.patches += `-i ${patchName}`;
      isFirstElement = false;
    } else global.jarNames.patches += ` -i ${patchName}`;
  }

  global.jarNames.isRooted = false;

  for (const patch of message.excludedPatches) {
    const patchName = patch.replace(/\|.+$/, '').replace(/\s/g, '');

    if (includedPatchesArray.includes(patchName)) continue;

    if (patch.includes('microg-support')) global.jarNames.isRooted = true;

    global.jarNames.patches += ` -e ${patchName}`;
  }
};
