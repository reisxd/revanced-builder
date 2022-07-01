import fetchURL from 'node-fetch';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import { load } from 'cheerio';
import opteric from './opteric.mjs';
import inquirer from 'inquirer';

const argParser = opteric(process.argv.join(' '));
const actualExec = util.promisify(exec);

const jarNames = {
  cli: './revanced/',
  patchesJar: './revanced/',
  integrations: './revanced/',
  deviceId: null,
  microG: './revanced/'
};

async function overWriteJarNames (link) {
  const fileName = link.split('/').pop();
  // i have to use ifs for this sorry
  if (fileName.includes('revanced-cli')) jarNames.cli += fileName;
  if (fileName.includes('revanced-patches') && fileName.endsWith('.jar')) {
    jarNames.patchesJar += fileName;
  }
  if (fileName.endsWith('unsigned.apk')) jarNames.integrations += fileName;
  if (fileName.startsWith('microg')) jarNames.microG += fileName
}

async function getDownloadLink (json) {
  const apiRequest = await fetchURL(
    `https://api.github.com/repos/${json.owner}/${json.repo}/releases/latest`
  );
  const jsonResponse = await apiRequest.json();
  return jsonResponse.assets;
}

async function getPage (pageUrl) {
  const pageRequest = await fetchURL(pageUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    }
  });
  return await pageRequest.text();
}

async function downloadYTApk () {
  const versionsList = await getPage(
    'https://www.apkmirror.com/apk/google-inc/youtube'
  );
  const $ = load(versionsList);
  let apkVersionText = $(
    'h5[class="appRowTitle wrapText marginZero block-on-mobile"]'
  ).get()[0].attribs.title;

  if (apkVersionText.includes('beta')) {
    apkVersionText = $(
      'h5[class="appRowTitle wrapText marginZero block-on-mobile"]'
    ).get()[1].attribs.title;
  }

  const apkVersion = apkVersionText
    .replace('YouTube ', '')
    .replace(/\./g, '-')
    .replace(' beta', '');
  const downloadLinkPage = await getPage(
    `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${apkVersion}-release/youtube-${apkVersion}-android-apk-download/`
  );
  const dlPage = load(downloadLinkPage);
  const pageLink = dlPage('a[class^="accent_bg btn btn-flat downloadButton"]')
    .first()
    .attr('href');
  const downloadPage = await getPage(`https://www.apkmirror.com${pageLink}`);
  const apkPage = load(downloadPage);
  const apkLink = apkPage('a[rel="nofollow"]').first().attr('href');
  const downloadRequest = await fetchURL(
    `https://www.apkmirror.com${apkLink}`,
    {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    }
  );

  const file = fs.createWriteStream('./revanced/youtube.apk');
  console.log("Downloading the YouTube APK, this'll take some time!");
  const stream = downloadRequest.body.pipe(file);

  await new Promise((resolve, reject) => {
    stream.once('finish', resolve);
    stream.once('error', (err) => {
      fs.unlink('./revanced/youtube.apk', () =>
        reject(new Error('Download failed.', err))
      );
    });
  });
  return console.log('Download complete!');
}

async function downloadFile (assets) {
  for (const asset of assets) {
    const dir = fs.readdirSync('./revanced/');
    overWriteJarNames(asset.browser_download_url);
    if (dir.includes(asset.browser_download_url.split('/').pop())) continue;
    const downloadRequest = await fetchURL(asset.browser_download_url);
    const file = fs.createWriteStream(
      `./revanced/${asset.browser_download_url.split('/').pop()}`
    );

    const stream = downloadRequest.body.pipe(file);

    await new Promise((resolve, reject) => {
      stream.once('finish', resolve);
      stream.once('error', (err) => {
        fs.unlink(
          `./revanced/${asset.browser_download_url.split('/').pop()}`,
          () => reject(new Error('Download failed.', err))
        );
      });
    });
  }
}

async function downloadFiles (repos) {
  for (const repo of repos) {
    const downloadLink = await getDownloadLink(repo);
    await downloadFile(downloadLink);
  }
}

async function getADBDeviceID () {
  let deviceId;
  const { stdout } = await actualExec('adb devices');
  const match = stdout.match(/^(\w+)\s+device$/m);
  if (match === null) {
    console.log('No device found! Fallback to only build.');
    return (jarNames.deviceId = '');
  }

  const [deviceIdN] = match;
  jarNames.deviceId = `-d ${deviceIdN.replace('device', '')} -c`;
  return deviceId;
}

async function checkForJavaADB () {
  try {
    const javaCheck = await actualExec('java -version');
    const javaVer = Array.from(javaCheck.stderr.matchAll(/version\s([^:]+)/g)).map((match) => match[1])[0].match(/"(.*)"/)[1]
    if (javaVer.split('.')[0] >= 17) {
      console.log('You have an outdated version of JDK.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk');
    return process.exit();
    }

    await actualExec('adb'); 
  } catch(e) {
    if (e.stderr.includes('java')) {
      console.log('You don\' have JDK installed.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk');
    }
    if (e.stderr.includes('adb')) {
      console.log('You don\' have ADB installed.\nPlease get it from here: https://developer.android.com/studio/releases/platform-tools\nIf you are confused on how you\'re gonna install it, watch some tutorials on YouTube!');
    }
  } 
}

switch (argParser.flags[0]) {
  case 'patches': {
    if (!fs.existsSync('./revanced')) {
      fs.mkdirSync('./revanced');
    }
    console.log('Downloading latest patches and cli...');

    const filesToDownload = [
      {
        owner: 'revanced',
        repo: 'revanced-cli'
      },
      {
        owner: 'revanced',
        repo: 'revanced-patches'
      }
    ];    await downloadFiles(filesToDownload);

    const { stdout, stderr } = await actualExec(
      `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} -l`
    );
    console.log(stdout || stderr);
    break;
  }

  case 'patch': {
    if (!fs.existsSync('./revanced')) {
      fs.mkdirSync('./revanced');
    }
    await checkForJavaADB()
    console.log('Downloading latest patches, integrations and cli...');

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
    await downloadFiles(filesToDownload);

    if (!argParser.flags.includes('manual-apk')) {
      await downloadYTApk();
    }

    await getADBDeviceID();
    let excludedPatches = '';

    if (argParser.options.exclude) {
      if (argParser.options.exclude.includes('microg-support')) {
        excludedPatches += '--mount';
      }
      for (const patch of argParser.options.exclude.split(',')) {
        excludedPatches += ` -e ${patch}`;
      }
    }
    console.log('Building ReVanced, please be patient!');

    const { stdout, stderr } = await actualExec(
      `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} --experimental -a ./revanced/youtube.apk ${jarNames.deviceId} -o ./revanced/revanced.apk -m ${jarNames.integrations} ${excludedPatches}`
    );
    console.log(stdout || stderr);

    if (
      stdout.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE') ||
      stderr.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')
    ) {
      console.log(
        'Couldn\'t install ReVanced properly. Reinstalling ReVanced...'
      );
      await actualExec('adb uninstall app.revanced.android.youtube');
      await actualExec('adb install revanced/revanced.apk');
    }
    
    console.log('Installing MicroG...');

    await actualExec(`adb install ${jarNames.microG}`);
    break;
  }

  default: {
    let patches = '';
    let useManualAPK;
    if (!fs.existsSync('./revanced')) {
      fs.mkdirSync('./revanced');
    }
    await checkForJavaADB();
    console.log('Downloading latest patches, integrations and cli...');

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
    await downloadFiles(filesToDownload);

    await getADBDeviceID();

    const getPatches = await actualExec(
      `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} -l`
    );

    const patchesArray =
      getPatches.stdout.match(/INFO:\s([^:]+)/g) ||
      getPatches.stderr.match(/INFO:\s([^:]+)/g);

    const patchesChoice = [];

    for (const patchName of patchesArray) {
      patchesChoice.push({
        name: patchName.replace('INFO: ', '')
      });
    }

      const patchesChoosed = await inquirer.prompt([
        {
          type: 'checkbox',
          message: 'Select the patches you want to exclude.',
          name: 'patches',
          choices: patchesChoice
        }
      ]);
      for (const patch of patchesChoosed.patches) {
        if (patch === 'microg-support') {
          patches += ' --mount';
        }
        patches += ` -e ${patch}`;
      }

    if (fs.existsSync('./revanced/youtube.apk')) {
        const useManualAPKAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useManualAPK',
            message:
              'The YouTube APK already exists in the revanced folder. Do you want to use it?',
            default: false
          }
        ]);
        useManualAPK = useManualAPKAnswer.useManualAPK;
    }

    if (!useManualAPK) {
      await downloadYTApk();
    }

    console.log('Building ReVanced, please be patient!');
    const { stdout, stderr } = await actualExec(
      `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} --experimental -a ./revanced/youtube.apk ${jarNames.deviceId} -o ./revanced/revanced.apk -m ${jarNames.integrations} ${patches}`
    );
    console.log(stdout || stderr);

    if (
      stdout.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE') ||
      stderr.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')
    ) {
      console.log(
        'Couldn\'t install ReVanced properly. Reinstalling ReVanced...'
      );
      await actualExec('adb uninstall app.revanced.android.youtube');
      await actualExec('adb install revanced/revanced.apk');
    }

    console.log('Installing MicroG...');

    await actualExec(`adb install ${jarNames.microG}`);
    break;
  }
}
