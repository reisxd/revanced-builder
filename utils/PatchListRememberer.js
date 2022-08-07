const fs = require('fs');

function createRemembererFile () {
  fs.writeFileSync(
    './includedPatchesList.json',
    JSON.stringify({
      packages: [
        {
          name: 'youtube',
          patches: []
        },
        {
          name: 'music',
          patches: []
        },
        {
          name: 'android',
          patches: []
        },
        {
          name: 'frontpage',
          patches: []
        }
      ]
    })
  );
}

function getPatchesList (pkgName) {
  let file = fs.readFileSync('./includedPatchesList.json');
  file = file.toString();
  file = JSON.parse(file);

  for (const pack of file.packages) {
    if (pack.name !== pkgName) continue;

    return pack.patches;
  }
}

function writePatches (pkgName, patches) {
  let file = fs.readFileSync('./includedPatchesList.json');
  file = file.toString();
  file = JSON.parse(file);

  for (const pack of file.packages) {
    if (pack.name !== pkgName) continue;
    const packageIndex = file.packages.indexOf(pack);

    file.packages[packageIndex].patches = patches;

    return fs.writeFileSync('./includedPatchesList.json', JSON.stringify(file));
  }
}

function getPatchList (pkgName) {
  if (!fs.existsSync('./includedPatchesList.json')) {
    createRemembererFile();
    return [];
  } else {
    return getPatchesList(pkgName);
  }
}

module.exports = {
  getPatchList,
  writePatches
};
