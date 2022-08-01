import fs from 'fs';
import { downloadFiles } from '../utils/FileDownlader.js';
import checkJDKandAapt2 from '../utils/checkJDKandAapt2.js';

global.jarNames = {
  cli: '',
  patchesJar: './revanced/',
  integrations: './revanced/',
  microG: './revanced/',
  selectedApp: '',
  patches: ''
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
  await checkJDKandAapt2(ws);
  return ws.send(
    JSON.stringify({
      event: 'finished'
    })
  );
}

export default UpdateFiles;
