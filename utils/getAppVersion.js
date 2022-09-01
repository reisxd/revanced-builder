const { EOL } = require('node:os');

const exec = require('./promisifiedExec.js');

/**
 * @param {string} pkgName
 * @param {import('ws').WebSocket} ws
 * @param {boolean} shouldReturnMsg
 */
module.exports = async function getAppVersion(pkgName, ws, shouldReturnMsg) {
  try {
    const { stdout, stderr } = await exec(
      process.platform !== 'android'
        ? `adb -s ${global.jarNames.deviceID} shell dumpsys package ${pkgName}`
        : `su -c dumpsys package ${pkgName}`,
      { maxBuffer: 10240 * 1024 }
    );
    const dumpSysOut = stdout || stderr;

    const versionMatch = dumpSysOut.match(/versionName=([^=]+)/);

    if (versionMatch === null) {
      if (shouldReturnMsg)
        ws.send(
          JSON.stringify({
            event: 'error',
            error:
              "The app you selected is not installed on your device. It's needed for rooted ReVanced."
          })
        );

      return null;
    }

    return versionMatch[1].replace(`${EOL}    `, '').match(/\d+(\.\d+)+/g)[0];
  } catch (e) {
    return null;
  }
};
