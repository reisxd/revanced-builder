const { promisify } = require('util');
const { exec } = require('child_process');
const { getPatchList } = require('../utils/PatchListRememberer.js');
const PatchesParser = require('../utils/PatchesParser.js');
const os = require('os');
const actualExec = promisify(exec);

module.exports = async function (message, ws) {
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

  const rememberedPatchList = getPatchList(global.jarNames.selectedApp);

  return ws.send(
    JSON.stringify({
      event: 'patchList',
      patchList: await PatchesParser(global.jarNames.selectedApp, hasRoot),
      rememberedPatchList
    })
  );
};
