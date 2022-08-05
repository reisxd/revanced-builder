const { promisify } = require('util');
const { exec } = require('child_process');
const os = require('os');
const actualExec = promisify(exec);

module.exports = async function (message, ws) {
  const patchList = [];
  const getPatches = await actualExec(
    `java -jar ${global.jarNames.cli} -a ${global.jarNames.integrations} -b ${global.jarNames.patchesJar} -l --with-packages`
  );
  let patchesText = getPatches.stdout;
  patchesText = patchesText.replace('\tdi', '\t di');
  const firstWord = patchesText.slice(0, patchesText.indexOf(' '));
  const patchRegex = new RegExp('\\t\\s([^\\t]+)', 'g');

  const patchesArray = patchesText.match(patchRegex);

  const pkgRegex = new RegExp(`${firstWord}\\s([^\\t]+)`, 'g');
  const pkgNameArray = patchesText.match(pkgRegex);
  const patchDescRegex = new RegExp(`\\t(.*) ${os.EOL}`, 'g');
  const patchDescsArray = patchesText.match(patchDescRegex);

  let index = -1;

  let hasRoot = true;
  if (os.platform() === 'android') {
    await actualExec('su -c exit').catch((err) => {
      const error = err.stderr || err.stdout;
      if (
        error.includes('No su program found on this device.') ||
        error.includes('Permission denied')
      ) {
        hasRoot = false;
      }
    });
  }

  for (const patchName of patchesArray) {
    const patch = patchName.replace(firstWord, '').replace(/\s/g, '');
    index++;
    let isRooted = false;
    if (
      pkgNameArray[index].replace(firstWord, '').replace(/\s/g, '') !==
      global.jarNames.selectedApp
    ) {
      continue;
    }

    const rootedPatches = ['microg-support', 'hide-cast-button'];

    if (rootedPatches.includes(patch.trim())) isRooted = true;

    if (!isRooted || hasRoot) {
      patchList.push({
        name: patch,
        description: patchDescsArray[index]
          .replace('\t', '')
          .match(new RegExp(`\\t(.*) ${os.EOL}`))[1],
        isRooted
      });
    }
  }

  return ws.send(
    JSON.stringify({
      event: 'patchList',
      patchList
    })
  );
};
