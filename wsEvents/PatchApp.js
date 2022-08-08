const { promisify } = require('util');
const { exec, spawn } = require('child_process');
const os = require('os');
const mountReVanced = require('../utils/mountReVanced.js');
const actualExec = promisify(exec);
const fs = require('fs');

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
  fs.rmdirSync('./revanced-cache', { recursive: true, force: true });
  if (!global.jarNames.isRooted && os.platform() === 'android') {
    await actualExec(
      `cp revanced/${global.apkInfo.outputName} /storage/emulated/0/${global.apkInfo.outputName}`
    );
    await actualExec('cp revanced/microg.apk /storage/emulated/0/microg.apk');

    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: `Copied files over to /storage/emulated/0/!\nPlease install ReVanced, its located in /storage/emulated/0/${global.apkInfo.outputName}\nand if you are building YT/YTM ReVanced without root, also install /storage/emulated/0/microg.apk.`
      })
    );
  } else if (os.platform() === 'android') {
    await mount(ws);
  } else if (!global.jarNames.deviceID) {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: `ReVanced has been built!\nPlease transfer over revanced/${global.apkInfo.outputName} and if you are using YT/YTM, revanced/microg.apk and install them!`
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

async function reinstallReVanced (ws) {
  let pkgNameToGetUninstalled;

  switch (global.jarNames.selectedApp) {
    case 'youtube': {
      if (!global.jarNames.isRooted) {
        pkgNameToGetUninstalled = 'app.revanced.android.youtube';
        break;
      } else break;
    }

    case 'music': {
      if (!global.jarNames.isRooted) {
        pkgNameToGetUninstalled = 'app.revanced.android.apps.youtube.music';
        break;
      } else break;
    }

    case 'android': {
      pkgNameToGetUninstalled = 'com.twitter.android';
      break;
    }

    case 'frontpage': {
      pkgNameToGetUninstalled = 'com.reddit.frontpage';
      break;
    }

    case 'warnapp': {
      pkgNameToGetUninstalled = 'de.dwd.warnapp';
      break;
    }
  }

  await actualExec(`adb uninstall ${pkgNameToGetUninstalled}`);
  await actualExec(`adb install revanced/${global.apkInfo.outputName}`);
  ws.send(
    JSON.stringify({
      event: 'buildFinished'
    })
  );
}

function outputName() {
  const part1 = "ReVanced";
  let part2;
  switch(global.jarNames.selectedApp) {
    case 'youtube':
      part2 = 'YouTube';
      break;
    case 'music':
      part2 = 'YouTube_Music';
      break;
    case 'frontpage':
      part2 = 'Reddit';
      break;
    case 'android':
      part2 = 'Twitter';
      break;
    case 'warnapp':
      part2 = 'WarnWetter';
      break;
  }
  // TODO: If the existing input APK is used from revanced/ without downloading, version and arch aren't set
  const part3 = global?.apkInfo?.version;
  const part4 = global?.apkInfo?.arch;
  const part5 = global.jarNames.cli.split(require('path').sep)[2].replace('revanced-cli-', '').replace('-all.jar', '');
  const part6 = global.jarNames.patchesJar.split(require('path').sep)[2].replace('revanced-patches-', '').replace('.jar', '');
  // Filename: ReVanced-<AppName>-<AppVersion>-[Arch]-<CLI_Version>-<PatchesVersion>.apk
  global.apkInfo.outputName = '';
  for (part of [part1, part2, part3, part4, part5, part6]){
    if (part) global.apkInfo.outputName += `-${part}`;
  }
  global.apkInfo.outputName += '.apk';
}

module.exports = async function (message, ws) {
  outputName();
  const args = [
    '-jar',
    global.jarNames.cli,
    '-b',
    global.jarNames.patchesJar,
    '-t',
    './revanced-cache',
    '--experimental',
    '-a',
    `./revanced/${global.jarNames.selectedApp}.apk`,
    '-o',
    `./revanced/${global.apkInfo.outputName}`
  ];

  if (os.platform() === 'android') {
    args.push('--custom-aapt2-binary');
    args.push('revanced/aapt2');
  }

  if (global.jarNames.selectedApp === 'youtube') {
    args.push('-m');
    args.push(global.jarNames.integrations);
  }

  if (global.jarNames.deviceID) {
    args.push('-d');
    args.push(global.jarNames.deviceID);
  }

  for (const patch of global.jarNames.patches.split(' ')) {
    args.push(patch);
  }

  if (global.jarNames.selectedApp.endsWith('frontpage')) {
    args.push('-r');
  }

  if (global.jarNames.isRooted && global.jarNames.deviceID) {
    args.push('--mount');
  }

  const buildProcess = await spawn('java', args, {
    maxBuffer: 5120 * 1024
  });

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

    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      await reinstallReVanced(ws);
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

    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      await reinstallReVanced(ws);
    }
  });
};
