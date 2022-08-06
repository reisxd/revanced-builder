const { promisify } = require('util');
const { exec } = require('child_process');
const os = require('os');
const mountReVanced = require('../utils/mountReVanced.js');
const actualExec = promisify(exec);

async function mount (ws) {
  let pkg;
  switch (global.jarNames.selectedApp) {
    case 'youtube': {
      pkg = 'com.google.android.youtube';
      break;
    }

    case 'music': {
      pkg = 'com.google.android.apps.youtube.music';
      break;
    }
  }

  ws.send(
    JSON.stringify({
      event: 'patchLog',
      log: 'Trying to mount ReVanced...'
    })
  );
  await mountReVanced(pkg, ws);
}

async function afterBuild (ws) {
  if (!global.jarNames.isRooted && os.platform() === 'android') {
    await actualExec(
      'cp revanced/revanced.apk /storage/emulated/0/revanced.apk'
    );
    await actualExec('cp revanced/microg.apk /storage/emulated/0/microg.apk');

    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: 'Copied files over to /storage/emulated/0/!\nPlease install ReVanced, its located in /storage/emulated/0/revanced.apk\nand if you are building YT/YTM ReVanced without root, also install /storage/emulated/0/microg.apk.'
      })
    );
  } else if (os.platform() === 'android') {
    await mount(ws);
  } else if (!global.jarNames.deviceID) {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: 'ReVanced has been built!\nPlease transfer over revanced/revanced.apk and if you are using YT/YTM, revanced/microg.apk and install them!'
      })
    );
  } else if (!global.jarNames.isRooted && global.jarNames.deviceID) {
    await actualExec('adb install revanced/microg.apk');
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: 'MicroG has been installed.'
      })
    );
  }

  ws.send(
    JSON.stringify({
      event: 'buildFinished'
    })
  );
}

module.exports = async function (message, ws) {
  const buildProcess = await exec(
    `java -jar ${global.jarNames.cli} -b ${global.jarNames.patchesJar} ${
      os.platform() === 'android' ? '--custom-aapt2-binary revanced/aapt2' : ''
    } -t ./revanced-cache --experimental -a ./revanced/${
      global.jarNames.selectedApp
    }.apk -o ./revanced/revanced.apk ${
      global.jarNames.selectedApp.endsWith('frontpage') ? '-r' : ''
    } ${
      global.jarNames.selectedApp === 'youtube'
        ? '-m ' + global.jarNames.integrations
        : ''
    } ${global.jarNames.patches} ${
      global.jarNames.deviceID ? `-d ${global.jarNames.deviceID}` : ''
    } ${global.jarNames.isRooted && global.jarNames.deviceID ? '--mount' : ''}`,
    { maxBuffer: 5120 * 1024 }
  );

  buildProcess.stdout.on('data', async (data) => {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: data.toString()
      })
    );

    if (data.toString().includes('Finished')) {
      await afterBuild(ws);
    }
  });

  buildProcess.stderr.on('data', async (data) => {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: data.toString()
      })
    );

    if (data.toString().includes('Finished')) {
      await afterBuild(ws);
    }
  });
};
