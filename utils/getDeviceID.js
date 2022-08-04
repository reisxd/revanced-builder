import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
const actualExec = promisify(exec);

export default async function () {
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
}
