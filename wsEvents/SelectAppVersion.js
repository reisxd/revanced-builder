const downloadApp = require('../utils/downloadApp.js');
const os = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');
const actualExec = promisify(exec);

module.exports = async function (message, ws) {
  let arch = message.arch;
  if (
    (global.jarNames.selectedApp === 'music' && global.jarNames.deviceID) ||
    os.platform() === 'android'
  ) {
    if (global.jarNames.deviceID) {
      const deviceArch = await actualExec(
        'adb shell getprop ro.product.cpu.abi'
      );
      arch = deviceArch.arch;
    } else {
      const deviceArch = await actualExec('getprop ro.product.cpu.abi');
      arch = deviceArch.arch;
    }
  }
  global.apkInfo = {
    version: message.versionChoosen,
    arch: arch
  }
  await downloadApp(ws);
};
