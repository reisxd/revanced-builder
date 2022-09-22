const { readFileSync } = require('node:fs');

/**
 * @param {string} packageName
 * @param {boolean} hasRoot
 */
module.exports = async function parsePatch(packageName, hasRoot) {
  const patchesList = JSON.parse(
    readFileSync(global.jarNames.patchesList, 'utf8')
  );

  const rootedPatches = [
    'microg-support',
    'hide-cast-button',
    'music-microg-support'
  ];
  const patches = [];

  global.versions = [];

  for (const patch of patchesList) {
    const isRooted = rootedPatches.includes(patch.name);

    // Check if the patch is compatible:
    let isCompatible = false;
    /** @type {string} */
    let compatibleVersion;

    for (const pkg of patch.compatiblePackages)
      if (pkg.name.endsWith(packageName)) {
        isCompatible = true;

        if (pkg.versions.length !== 0) {
          compatibleVersion = pkg.versions.at(-1);

          global.versions.push(compatibleVersion);
        }
      }

    if (!isCompatible || (isRooted && !hasRoot)) continue;

    for (const dependencyName of patch.dependencies) {
      if (dependencyName.includes('resource')) {
        global.jarNames.patch.resources = true;
      } else global.jarNames.patch.resources = false;

      if (dependencyName.includes('integrations')) {
        global.jarNames.patch.integrations = true;
      } else global.jarNames.patch.integrations = false;
    }

    patches.push({
      name: patch.name,
      description: patch.description,
      maxVersion: compatibleVersion || ' ',
      isRooted,
      excluded: patch.excluded || patch.deprecated
    });
  }

  if (global.versions.length === 0) {
    global.versions = 'NOREC';
  }

  return patches;
};
