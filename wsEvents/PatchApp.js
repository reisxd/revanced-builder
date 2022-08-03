import { promisify } from 'util';
import { exec } from 'child_process';
import os from 'os';
import mountReVanced from '../utils/mountReVanced.js';
const actualExec = promisify(exec);

async function mount(ws) {
  let pkg;
  switch (global.jarNames.selectedApp) {
    case 'youtube': {
      pkg = 'com.google.android.youtube';
    }

    case 'music': {
      pkg = 'com.google.android.apps.youtube.music';
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

export default async function (message, ws) {
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
    } ${global.jarNames.patches}`,
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
      if (!global.jarNames.isRooted) {
        await actualExec(
          'cp revanced/revanced.apk /storage/emulated/0/revanced.apk'
        );
        await actualExec(
          'cp revanced/microg.apk /storage/emulated/0/microg.apk'
        );

        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: 'Copied files over to /storage/emulated/0/!\nPlease install ReVanced, its located in /storage/emulated/0/revanced.apk\nand if you are building YT/YTM ReVanced without root, also install /storage/emulated/0/microg.apk.'
          })
        );
      } else {
        await mount(ws);
      }
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
      if (!global.jarNames.isRooted) {
        await actualExec(
          'cp revanced/revanced.apk /storage/emulated/0/revanced.apk'
        );
        await actualExec(
          'cp revanced/microg.apk /storage/emulated/0/microg.apk'
        );

        ws.send(
          JSON.stringify({
            event: 'patchLog',
            log: 'Copied files over to /storage/emulated/0/!\nPlease install ReVanced, its located in /storage/emulated/0/revanced.apk\nand if you are building YT/YTM ReVanced without root, also install /storage/emulated/0/microg.apk.'
          })
        );
      } else {
        await mount(ws);
      }
    }
  });
}
