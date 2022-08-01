import { promisify } from 'util';
import { exec } from 'child_process';
import { dloadFromURL } from './FileDownlader.js';
import os from 'os';
import fs from 'fs';
const actualExec = promisify(exec);

export default async function (ws) {
  try {
    await actualExec('java -v');
  } catch (e) {
    if (e.stderr.includes('not found')) {
      ws.send(
        JSON.stringify({
          event: 'error',
          error:
            "You don't have JDK installed.\nPlease close ReVanced Builder and install it using:\npkg install openjdk-17"
        })
      );
    }
  }

  if (!fs.existsSync('revanced/aapt2')) {
    await dloadFromURL(
      'https://github.com/reisxd/revanced-cli-termux/raw/main/aapt2.zip',
      'aapt2.zip',
      ws
    );
    await actualExec('unzip aapt2.zip');
    switch (os.arch()) {
      case 'arm64': {
        await actualExec('cp arm64-v8a/aapt2 revanced/aapt2');
        await actualExec('chmod +x revanced/aapt2');
        break;
      }

      case 'arm': {
        await actualExec('cp armeabi-v7a/aapt2 revanced/aapt2');
        await actualExec('chmod +x revanced/aapt2');
        break;
      }
    }
  }
}
