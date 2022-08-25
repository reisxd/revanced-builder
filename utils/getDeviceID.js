const os = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');
const actualExec = promisify(exec);

module.exports = async function () {
  try {
    const { stdout } = await actualExec('adb devices');
    const adbDeviceIdRegex = new RegExp(`${os.EOL}(.*?)\t`, 'g');
    const match = stdout.match(adbDeviceIdRegex);
    if (match === null) {
      return null;
    }
    let deviceIds = [];
    for (let deviceId of match) {
      deviceIds.push(deviceId.replace(os.EOL, '').replace('\t', ''));
    }
    return deviceIds;
  } catch (e) {
    return null;
  }
};
