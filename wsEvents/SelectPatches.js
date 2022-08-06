const { writePatches } = require('../utils/PatchListRememberer.js');

module.exports = async function (message, ws) {
  global.jarNames.patches = '';
  writePatches(global.jarNames.selectedApp, message.selectedPatches);
  const includedPatchesArray = [];
  for (const patch of message.selectedPatches) {
    const patchName = patch.replace(/\|.+(.*)$/, '').replace(/\s/g, '');
    includedPatchesArray.push(patchName);
    global.jarNames.patches += ` -i ${patchName}`;
  }

  global.jarNames.isRooted = false;

  for (const patch of message.excludedPatches) {
    if (includedPatchesArray.includes(patch)) continue;
    if (patch.includes('microg-support')) {
      global.jarNames.isRooted = true;
    }

    global.jarNames.patches += ` -e ${patch}`;
  }
};
