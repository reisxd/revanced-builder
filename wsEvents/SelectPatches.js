module.exports = async function (message, ws) {
  global.jarNames.patches = '';
  const includedPatchesArray = [];
  for (const patch of message.selectedPatches) {
    const patchName = patch.replace(/\|.+(.*)$/, '').replace(/\s/g, '');
    includedPatchesArray.push(patchName);
    global.jarNames.patches += ` -i ${patchName}`;
  }

  for (const patch of message.excludedPatches) {
    if (includedPatchesArray.includes(patch)) continue;
    if (patch.includes('microg-support')) {
      global.jarNames.isRooted = true;
    }

    global.jarNames.patches += ` -e ${patch}`;
  }
};
