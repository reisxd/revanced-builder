const { EOL } = require('node:os');

const exec = require('../utils/promisifiedExec.js');

const downloadApp = require('../utils/downloadApp.js');

/**
 * @param {Record<string, any>} message
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function selectAppVersion(message, ws) {
  let arch = message.arch;

  if (
    (global.jarNames.selectedApp === 'music' && global.jarNames.deviceID) ||
    process.platform === 'android'
  ) {
    const deviceArch = await exec(
      global.jarNames.deviceID
        ? 'adb shell getprop ro.product.cpu.abi'
        : 'getprop ro.product.cpu.abi'
    );
    arch = deviceArch.stdout.replace(EOL, '');
  }

  global.apkInfo = {
    version: message.versionChoosen,
    arch
  };

  await downloadApp(ws);
};
