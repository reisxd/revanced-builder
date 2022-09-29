const { EOL } = require('node:os');

const exec = require('./promisifiedExec.js');
function sendError(ws) {
  ws.send(
    JSON.stringify({
      event: 'error',
      error:
        "The app you selected is not installed on your device. It's needed for rooted ReVanced."
    })
  );
}
async function getAppVersion_(pkgName, ws, shouldReturnMsg, deviceId) {
  try {
    const { stdout, stderr } = await exec(
      process.platform !== 'android'
        ? `adb -s ${deviceId} shell dumpsys package ${pkgName}`
        : `su -c dumpsys package ${pkgName}`,
      { maxBuffer: 10240 * 1024 }
    );
    const dumpSysOut = stdout || stderr;

    const versionMatch = dumpSysOut.match(/versionName=([^=]+)/);

    if (versionMatch === null) {
      if (shouldReturnMsg) {
        sendError(ws);
      }

      return null;
    }

    return versionMatch[1].replace(`${EOL}    `, '').match(/\d+(\.\d+)+/g)[0];
  } catch (e) {
    if (shouldReturnMsg) {
      sendError(ws);
    }

    return null;
  }
}

/**
 * @param {string} pkgName
 * @param {import('ws').WebSocket} ws
 * @param {boolean} shouldReturnMsg
 */
async function getAppVersion(pkgName, ws, shouldReturnMsg) {
  const versions = [];

  if (process.platform === 'android')
    return await getAppVersion_(pkgName, ws, shouldReturnMsg);

  for (const deviceId of global.jarNames.devices) {
    const version = await getAppVersion_(
      pkgName,
      ws,
      shouldReturnMsg,
      deviceId
    );
    versions.push(version);
  }

  if (versions.every((version) => version === versions[0])) {
    return versions[0];
  } else {
    return ws.send(
      JSON.stringify({
        event: 'error',
        error: `The devices you're trying to install ReVanced doesn't have a matching version. Please install version ${versions[0]} to every device.`
      })
    );
  }
}

module.exports = {
  getAppVersion_,
  getAppVersion
};
