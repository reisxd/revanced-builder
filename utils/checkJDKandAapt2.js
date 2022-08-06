const { promisify } = require('util');
const { exec } = require('child_process');
const { dloadFromURL } = require('./FileDownlader.js');
const os = require('os');
const fs = require('fs');
const actualExec = promisify(exec);

module.exports = async function (ws) {
  try {
    await actualExec('java -v');
  } catch (e) {
    if (e.stderr.includes('not found')) {
      ws.send(
        JSON.stringify({
          event: 'error',
          error:
            "You don't have JDK installed.Please close ReVanced Builder and install it using:pkg install openjdk-17"
        })
      );
    }
  }

  if (!fs.existsSync('revanced/aapt2')) {
    await dloadFromURL(
      'https://github.com/reisxd/revanced-cli-termux/raw/main/aapt2.zip',
      'revanced/aapt2.zip',
      ws
    );
    await actualExec('unzip revanced/aapt2.zip -d revanced/');
    switch (os.arch()) {
      case 'arm64': {
        await actualExec('cp revanced/arm64-v8a/aapt2 revanced/aapt2');
        await actualExec('chmod +x revanced/aapt2');
        break;
      }

      case 'arm': {
        await actualExec('cp revanced/armeabi-v7a/aapt2 revanced/aapt2');
        await actualExec('chmod +x revanced/aapt2');
        break;
      }
    }
    await actualExec('rm -rf revanced/arm64-v8a revanced/armeabi-v7a revanced/x86 revanced/aapt2.zip');
  }
};
