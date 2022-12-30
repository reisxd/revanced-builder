const exec = require('../utils/promisifiedExec.js');

const { getPatchList } = require('../utils/Settings.js');
const parsePatch = require('../utils/PatchesParser.js');

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function getPatches(ws) {
  let hasRoot = true;

  if (process.platform === 'android')
    await exec('su -c exit').catch((err) => {
      const error = err.stderr || err.stdout;

      if (
        error.includes('No su program found on this device.') ||
        error.includes('Permission denied')
      )
        hasRoot = false;
    });

  const rememberedPatchList = getPatchList(
    global.jarNames.selectedApp.packageName
  );

  ws.send(
    JSON.stringify({
      event: 'patchList',
      patchList: await parsePatch(
        global.jarNames.selectedApp.packageName,
        hasRoot
      ),
      rememberedPatchList,
      uploadedApk: global.jarNames.selectedApp.uploaded
    })
  );
};
