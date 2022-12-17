const { join: joinPath } = require('node:path');
const { unlinkSync, existsSync } = require('node:fs');
const { extract } = require('tar');
const exec = require('./promisifiedExec.js');

const getDeviceID = require('../utils/getDeviceID.js');
const { dloadFromURL } = require('../utils/FileDownloader');

function getConsts(name) {
  switch (name) {
    case 'jreDir':
      return joinPath(
        global.revancedDir,
        `zulu17.38.21-ca-jre17.0.5-${getConsts('platform')}_${getConsts(
          'arch'
        )}`
      );
    case 'jreBin':
      return joinPath(
        getConsts('jreDir'),
        `bin/java${process.platform === 'win32' ? '.exe' : ''}`
      );
    case 'platform': {
      let platform = '';
      switch (process.platform) {
        case 'darwin':
          platform = 'macosx';
          break;
        case 'linux':
          platform = 'linux';
          break;
        case 'win32':
          platform = 'win';
          break;
      }
      return platform;
    }
    case 'arch': {
      let arch = '';
      switch (process.arch) {
        case 'arm':
          arch = 'aarch32hf';
          break;
        case 'arm64':
          arch = 'aarch64';
          break;
        case 'ia32':
          arch = 'i686';
          break;
        case 'x64':
          arch = 'x64';
          break;
      }
      return arch;
    }
  }
}

async function downloadJDK(ws) {
  try {
    const output = joinPath(global.revancedDir, 'JRE.tar.gz');

    await dloadFromURL(
      `https://cdn.azul.com/zulu/bin/zulu17.38.21-ca-jre17.0.5-${getConsts(
        'platform'
      )}_${getConsts('arch')}.tar.gz`,
      output,
      ws
    );

    extract({ cwd: global.revancedDir, file: output }, (err) => {
      if (err) throw err;
      unlinkSync(output);
      global.javaCmd = getConsts('jreBin');
    });
  } catch (err) {
    console.error(err);
    ws.send(
      JSON.stringify({
        event: 'error',
        error:
          'An error occured while trying to install Zulu JDK.<br>Please install a supported version manually from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
      })
    );
  }
}

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function checkJDKAndADB(ws) {
  try {
    const javaCheck = await exec('java -version');
    const javaVerLog = javaCheck.stderr || javaCheck.stdout;
    const javaVer = javaVerLog.match(/version\s([^:]+)/)[1].match(/"(.*)"/)[1];

    if (javaVer.split('.')[0] < 17 || !javaVerLog.includes('openjdk')) {
      if (existsSync(getConsts('jreBin'))) {
        global.javaCmd = getConsts('jreBin');
      } else {
        await downloadJDK(ws);
      }
    } else {
      global.javaCmd = 'java'; // If the System java is supported, use it.
    }

    const deviceIds = await getDeviceID();

    if (deviceIds !== null) {
      if (deviceIds[1]) {
        ws.send(
          JSON.stringify({
            event: 'multipleDevices'
          })
        );

        return;
      } else if (deviceIds[0]) global.jarNames.devices = deviceIds;
    } else global.jarNames.devices = [];
  } catch (err) {
    if (err.stderr.includes('java')) {
      if (existsSync(getConsts('jreBin'))) {
        global.javaCmd = getConsts('jreBin');
      } else {
        await downloadJDK(ws);
      }
    }
  }
};
