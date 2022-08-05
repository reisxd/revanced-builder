const os = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');
const actualExec = promisify(exec);

module.exports = async function () {
  try {
    const { stdout } = await actualExec('adb devices');
    const adbDeviceIdRegex = new RegExp(`${os.EOL}(.*?)\t`);
    const match = stdout.match(adbDeviceIdRegex);
    if (match === null) {
      return null;
    }

    const deviceIdN = match[1];
    global.jarNames.deviceID = deviceIdN;
    return deviceIdN;
  } catch (e) {
    return null;
  }
};
