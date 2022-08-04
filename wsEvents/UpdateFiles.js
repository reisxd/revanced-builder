const fs = require('fs');
const { downloadFiles } = require('../utils/FileDownlader.js');
const checkJDKandAapt2 = require('../utils/checkJDKandAapt2.js');
const checkJDkAndADB = require('../utils/checkJDKAndADB.js');
const os = require('os');

global.jarNames = {
  cli: '',
  patchesJar: './revanced/',
  integrations: './revanced/',
  microG: './revanced/',
  selectedApp: '',
  patches: '',
  isRooted: false,
  deviceID: ''
};

async function UpdateFiles (message, ws) {
  if (!fs.existsSync('./revanced')) {
    fs.mkdirSync('./revanced');
  }
  if (fs.existsSync('./revanced-cache')) {
    fs.rmSync('./revanced-cache', { recursive: true, force: true });
  }

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

  await downloadFiles(filesToDownload, ws);
  if (os.platform() === 'android') {
    await checkJDKandAapt2(ws);
  } else {
    await checkJDkAndADB(ws);
  }

  return ws.send(
    JSON.stringify({
      event: 'finished'
    })
  );
}

module.exports =  UpdateFiles;
