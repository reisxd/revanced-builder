const fetchURL = require('node-fetch');

module.exports = async (packageName, hasRoot) => {
  const patchesRequest = await fetchURL(
    'https://raw.githubusercontent.com/revanced/revanced-patches/main/patches.json',
    {
      headers: {
        host: 'wwww.github.com'
      }
    }
  );
  const patchesJSON = await patchesRequest.json();

  const rootedPatches = [
    'microg-support',
    'hide-cast-button',
    'music-microg-support'
  ];

  const patches = [];

  global.versions = [];

  for (const patch of patchesJSON) {
    const isRooted = rootedPatches.includes(patch.name);

    // Check if the patch is compatible:
    let isCompatible = false;
    let compatibleVersion;
    for (const pkg of patch.compatiblePackages) {
      if (pkg.name.endsWith(packageName)) {
        isCompatible = true;
        console.log(pkg.versions);
        if (pkg.versions.length !== 0) {
          compatibleVersion = pkg.versions[pkg.versions.length - 1];
          global.versions.push(compatibleVersion);
        }
      }
    }

    if (!isCompatible) {
      continue;
    }
    if (isRooted || !hasRoot) {
      continue;
    }

    patches.push({
      name: patch.name,
      description: patch.description,
      maxVersion: compatibleVersion,
      isRooted
    });
  }

  return patches;
};
