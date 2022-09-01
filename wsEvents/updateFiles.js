const { existsSync, mkdirSync, rmSync } = require('node:fs');

const { downloadFiles } = require('../utils/FileDownloader.js');
const checkJDKAndAapt2 = require('../utils/checkJDKAndAapt2.js');
const checkJDkAndADB = require('../utils/checkJDKAndADB.js');

global.jarNames = {
  cli: '',
  patchesJar: './revanced/',
  integrations: './revanced/',
  microG: './revanced/',
  patchesList: './revanced/',
  selectedApp: '',
  patches: '',
  isRooted: false,
  deviceID: ''
};

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function updateFiles(ws) {
  if (!existsSync('revanced')) mkdirSync('./revanced');
  if (existsSync('revanced-cache'))
    rmSync('revanced-cache', { recursive: true, force: true });

  const filesToDownload = [
    {
      owner: 'revanced',
      repo: 'revanced-cli'
    },
    {
      owner: 'revanced',
      repo: 'revanced-patches'
    },
    {
      owner: 'revanced',
      repo: 'revanced-integrations'
    },
    {
      owner: 'TeamVanced',
      repo: 'VancedMicroG'
    }
  ];

  if (
    typeof global.downloadFinished !== 'undefined' &&
    !global.downloadFinished
  ) {
    ws.send(
      JSON.stringify({
        event: 'error',
        error:
          "Downloading process hasn't finished and you tried to download again."
      })
    );

    return;
  }

  global.downloadFinished = false;

  await downloadFiles(filesToDownload, ws);

  if (process.platform === 'android') await checkJDKAndAapt2(ws);
  else await checkJDkAndADB(ws);

  global.downloadFinished = true;

  ws.send(
    JSON.stringify({
      event: 'finished'
    })
  );
};
