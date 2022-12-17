const { join: joinPath } = require('node:path');

const exec = require('../utils/promisifiedExec.js');

const { getAppVersion_ } = require('../utils/getAppVersion.js');
const { getDownloadLink } = require('../utils/FileDownloader.js');
const mountReVancedInstaller = require('../utils/mountReVancedInstaller.js');

module.exports = async function installReVanced(ws) {
  if (
    !global.jarNames.isRooted &&
    global.jarNames.devices &&
    global.jarNames.devices[0]
  ) {
    for (const deviceId of global.jarNames.devices) {
      ws.send(
        JSON.stringify({
          event: 'patchLog',
          log: `INFO: Installing ReVanced (non-root) for ${deviceId}.`
        })
      );
      try {
        await exec(
          `adb -s ${deviceId} install "${joinPath(
            global.revancedDir,
            global.outputName
          )}"`
        );

        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: `INFO: Installed ReVanced (non-root) for ${deviceId}.`
          })
        );
      } catch (e) {
        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: `SEVERE: Could not install ReVanced to ${deviceId}. Please check the console for more info.`
          })
        );

        throw e;
      }
    }
  } else if (
    global.jarNames.isRooted &&
    global.jarNames.devices &&
    global.jarNames.devices[0]
  ) {
    for (const deviceId of global.jarNames.devices) {
      ws.send(
        JSON.stringify({
          event: 'patchLog',
          log: `INFO: Installing ReVanced (root) for ${deviceId}.`
        })
      );
      try {
        mountReVancedInstaller(deviceId);

        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: `INFO: Installed ReVanced (root) for ${deviceId}.`
          })
        );
      } catch (e) {
        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: `SEVERE: Could not install ReVanced to ${deviceId}. Please check the console for more info.`
          })
        );

        throw e;
      }
    }
  }

  if (
    !global.jarNames.isRooted &&
    global.jarNames.devices &&
    global.jarNames.devices[0] &&
    (global.jarNames.selectedApp.packageName === 'com.google.android.youtube' ||
      global.jarNames.selectedApp.packageName ===
        'com.google.android.apps.youtube.music')
  ) {
    const currentMicroGVersion = (
      await getDownloadLink({ owner: 'TeamVanced', repo: 'VancedMicroG' })
    ).version
      .replace('v', '')
      .split('-')[0];

    for (const deviceId of global.jarNames.devices) {
      const microGVersion = await getAppVersion_(
        'com.mgoogle.android.gms',
        null,
        false,
        deviceId
      );

      if (!microGVersion || microGVersion !== currentMicroGVersion) {
        try {
          await exec(`adb -s ${deviceId} install "${global.jarNames.microG}"`);

          ws.send(
            JSON.stringify({
              event: 'patchLog',
              log: `INFO: MicroG has been ${
                !microGVersion ? 'installed' : 'updated'
              } for device ${deviceId}.`
            })
          );
        } catch (e) {
          ws.send(
            JSON.stringify({
              event: 'patchLog',
              log: `SEVERE: Could not ${
                !microGVersion ? 'install' : 'update'
              } MicroG for device ${deviceId}. Please check the console for more info.`
            })
          );

          throw e;
        }
      } else
        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: `MicroG is already up to date for device ${deviceId}`
          })
        );
    }
  }

  return ws.send(
    JSON.stringify({
      event: 'buildFinished'
    })
  );
};
