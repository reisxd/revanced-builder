const fetchURL = require('node-fetch');
const Progress = require('node-fetch-progress');
const { SingleBar: ProgressBar, Presets } = require('cli-progress');
const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const { load } = require('cheerio');
const opteric = require('./opteric.js');
const inquirer = require('inquirer');

const argParser = opteric(process.argv.join(' '));
const actualExec = util.promisify(exec);

let adbExists = true;
let foundDevice = false;
const jarNames = {
  cli: './revanced/',
  patchesJar: './revanced/',
  integrations: './revanced/',
  deviceId: '',
  microG: './revanced/'
};

process.on('uncaughtException', async (err, origin) => {
  console.log(
    `Caught exception: ${err}\nException origin: ${origin}\nPlease make an issue at https://github.com/reisxd/revanced-builder/issues.`
  );

  await exitProcess();
});

process.on('unhandledRejection', async (reason) => {
  console.log('An error occured.');
  console.log(reason);
  console.log(
    '\nPlease make an issue at https://github.com/reisxd/revanced-builder/issues.'
  );
  await exitProcess();
});

async function exitProcess () {
  console.log('Press any key to exit...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(() => process.stdin.on('data', () => process.exit()));
}

async function overWriteJarNames (link) {
  const fileName = link.split('/').pop();
  // i have to use ifs for this sorry
  if (fileName.includes('revanced-cli')) jarNames.cli += fileName;
  if (fileName.includes('revanced-patches') && fileName.endsWith('.jar')) {
    jarNames.patchesJar += fileName;
  }
  if (fileName.endsWith('unsigned.apk')) jarNames.integrations += fileName;
  if (fileName.startsWith('microg')) jarNames.microG += fileName;
}

async function getDownloadLink (json) {
  const apiRequest = await fetchURL(
    `https://api.github.com/repos/${json.owner}/${json.repo}/releases/latest`
  );
  const jsonResponse = await apiRequest.json();
  let assets = jsonResponse?.assets;
  if (jsonResponse.error || !apiRequest.ok) {
    const assetsGH = [];
    const releasesPage = await fetchURL(
      `https://github.com/${json.owner}/${json.repo}/releases/latest`
    );
    if (!releasesPage.ok) {
      throw new Error(
        'You got ratelimited from GitHub\n...Completely? What did you even do?'
      );
    }
    const releasePage = await releasesPage.text();
    const $ = load(releasePage);
    for (const downloadLink of $('a[data-skip-pjax=""]').get()) {
      if (!downloadLink.attribs.href.endsWith('.tar.gz')) {
        if (!downloadLink.attribs.href.endsWith('.zip')) {
          assetsGH.push({
            browser_download_url: `https://github.com${downloadLink.attribs.href}`
          });
        }
      }
    }
    assets = assetsGH;
  }
  return assets;
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

async function dloadFromURL (url, outputPath) {
  const request = await fetchURL(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    }
  });
  const writeStream = fs.createWriteStream(outputPath);
  const downloadStream = request.body.pipe(writeStream);

  const progress = new Progress(request, { throttle: 50 });
  const pbar = new ProgressBar(
    {
      format: `[${outputPath
        .split('/')
        .pop()}] {bar} | {percentage}% | ETA: {eta_formatted} | Speed: {rate}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true
    },
    Presets.shades_classic
  );
  pbar.start(100, 0);

  return new Promise((resolve, reject) => {
    progress.on('progress', (p) => {
      pbar.update(parseInt(p.progress * 100), {
        rate: p.rateh
      });
    });
    downloadStream.once('finish', () => {
      pbar.stop();
      console.log(`[${outputPath.split('/').pop()}] \u2713`);
      resolve();
    });
    downloadStream.once('error', (err) => {
      fs.unlink(outputPath, () => {
        pbar.stop();
        console.log(`[${outputPath.split('/').pop()}] \u2714`);
        reject(new Error('Download failed.', err));
      });
    });
  });
}

async function downloadYTApk (ytVersion) {
  const versionsList = await getPage(
    'https://www.apkmirror.com/apk/google-inc/youtube'
  );

  const versionList = [];
  let indx = 0;
  let versionChoosen;
  const $ = load(versionsList);

  if (!ytVersion) {
    for (const version of $(
      'h5[class="appRowTitle wrapText marginZero block-on-mobile"]'
    ).get()) {
      if (indx === 10) continue;
      const versionName = version.attribs.title.replace('YouTube ', '');
      indx++;
      if (versionName.includes('beta')) continue;
      versionList.push({
        name: versionName
      });
    }

    versionChoosen = await inquirer.prompt([
      {
        type: 'list',
        name: 'version',
        message: 'Select a YT version to download.',
        choices: versionList
      }
    ]);
  }
  let apkVersion;

  if (ytVersion) apkVersion = ytVersion.replace(/\./g, '-');
  if (versionChoosen) apkVersion = versionChoosen.version.replace(/\./g, '-');

  const versionDownload = await fetchURL(
    `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${apkVersion}-release/`
  );
  const versionDownloadList = await versionDownload.text();

  const vDLL = load(versionDownloadList);
  const dlLink = vDLL('span[class="apkm-badge"]')
    .first()
    .parent()
    .children('a[class="accent_color"]')
    .first()
    .attr('href');

  const downloadLink = await fetchURL(`https://www.apkmirror.com${dlLink}`);
  const downloadLinkPage = await downloadLink.text();

  const dlPage = load(downloadLinkPage);
  const pageLink = dlPage('a[class^="accent_bg btn btn-flat downloadButton"]')
    .first()
    .attr('href');
  const downloadPage = await getPage(`https://www.apkmirror.com${pageLink}`);
  const apkPage = load(downloadPage);
  const apkLink = apkPage('a[rel="nofollow"]').first().attr('href');

  console.log("Downloading the YouTube APK, this'll take some time!");
  await dloadFromURL(
    `https://www.apkmirror.com${apkLink}`,
    './revanced/youtube.apk'
  );
  return console.log('Download complete!');
}

async function downloadFile (assets) {
  for (const asset of assets) {
    const dir = fs.readdirSync('./revanced/');
    overWriteJarNames(asset.browser_download_url);
    if (dir.includes(asset.browser_download_url.split('/').pop())) {
      if (
        asset.browser_download_url.split('/').pop() !==
        'app-release-unsigned.apk'
      ) {
        if (asset.browser_download_url.split('/').pop() !== 'microg.apk') {
          continue;
        }
      }
    }
    await dloadFromURL(
      asset.browser_download_url,
      `./revanced/${asset.browser_download_url.split('/').pop()}`
    );
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
  const adbDeviceIdRegex = new RegExp(`${require('os').EOL}(.*?)\t`);
  const match = stdout.match(adbDeviceIdRegex);
  if (match === null) {
    console.log('No device found! Fallback to only build.');
    return;
  }

  const deviceIdN = match[1];
  jarNames.deviceId = `-d ${deviceIdN} -c`;
  foundDevice = true;
  return deviceId;
}

async function checkForJavaADB () {
  try {
    const javaCheck = await actualExec('java -version');
    const javaVerLog = javaCheck.stderr || javaCheck.stdout;
    const javaVer = Array.from(javaVerLog.matchAll(/version\s([^:]+)/g))
      .map((match) => match[1])[0]
      .match(/"(.*)"/)[1];
    if (javaVer.split('.')[0] < 17) {
      console.log(
        'You have an outdated version of JDK.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
      );
      return await exitProcess();
    }

    if (!javaVerLog.includes('Zulu')) {
      console.log(
        'You have Java, but not Zulu JDK. You need to install it because of signing problems.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
      );

      return await exitProcess();
    }
    await actualExec('adb');
  } catch (e) {
    if (e.stderr.includes('java')) {
      console.log(
        "You don't have JDK installed.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk"
      );

      return await exitProcess();
    }
    if (e.stderr.includes('adb')) {
      console.log(
        "You don't have ADB installed.\nPlease get it from here: https://developer.android.com/studio/releases/platform-tools\nIf you are gonna use rooted ReVanced, this is needed."
      );
      adbExists = false;
    }
  }
}

async function getYTVersion () {
  const { stdout, stderr } = await actualExec(
    'adb shell dumpsys package com.google.android.youtube'
  );
  const dumpSysOut = stdout || stderr;
  if (!dumpSysOut.match(/versionName=([^=]+)/)) {
    throw new Error(
      "YouTube is not installed on your device\nIt's needed for rooted ReVanced."
    );
  }
  return dumpSysOut
    .match(/versionName=([^=]+)/)[1]
    .replace(`${require('os').EOL}    `, '')
    .match(/[\d]+(\.\d+)+/g)[0];
}

async function preflight (listOnly) {
  if (!fs.existsSync('./revanced')) {
    fs.mkdirSync('./revanced');
  }
  if (fs.existsSync('./revanced-cache')) {
    fs.rmSync('./revanced-cache', { recursive: true, force: true });
  }
  console.log('Downloading required files...');

  const filesToDownload = [
    {
      owner: 'revanced',
      repo: 'revanced-cli'
    },
    {
      owner: 'revanced',
      repo: 'revanced-patches'
    },
  ];
  if (!listOnly) {
    filesToDownload.push(
      {
      owner: 'revanced',
      repo: 'revanced-integrations'
      },
      {
        owner: 'TeamVanced',
        repo: 'VancedMicroG'
      }
    );
  }
  await downloadFiles(filesToDownload);

  if (!listOnly) {
    await checkForJavaADB();
    if (adbExists) {
      await getADBDeviceID();
    }
  }
}


(async () => {
  switch (argParser.flags[0]) {
    case 'patches': {
      await preflight(true);
      const { stdout, stderr } = await actualExec(
        `java -jar ${jarNames.cli} -a NeverGonnaGiveYouUp -b ${jarNames.patchesJar} -l`
      );
      console.log(stdout || stderr);
      break;
    }

    case 'patch': {
      let excludedPatches = '';
      let includedPatches = '';
      let ytVersion;
      let isRooted = false;

      await preflight(false);

      if (argParser.options.exclude) {
        if (argParser.options.exclude.includes('microg-support')) {
          if (!adbExists) {
            console.log(
              "You don't have ADB installed.\nPlease get it from here: https://developer.android.com/studio/releases/platform-tools\n"
            );
            return await exitProcess();
          }

          if (foundDevice) {
            ytVersion = await getYTVersion();
            excludedPatches += ' --mount';
            isRooted = true;
          } else {
            throw new Error(
              "Couldn't find the device. Please plug in the device."
            );
          }
        }
        if (!argParser.options.exclude.includes(',')) {
          excludedPatches = ` -e ${argParser.options.exclude}`;
        } else {
          for (const patch of argParser.options.exclude.split(',')) {
            excludedPatches += ` -e ${patch}`;
          }
        }
      }

      if (argParser.options.include) {
        if (!argParser.options.include.includes(',')) {
          includedPatches = ` -i ${argParser.options.include}`;
        } else {
          for (const patch of argParser.options.include.split(',')) {
            includedPatches += ` -i ${patch}`;
          }
        }
      }

      if (!argParser.flags.includes('manual-apk')) {
        await downloadYTApk(ytVersion);
      }

      console.log('Building ReVanced, please be patient!');

      const { stdout, stderr } = await actualExec(
        `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} --experimental -a ./revanced/youtube.apk ${jarNames.deviceId} -o ./revanced/revanced.apk -m ${jarNames.integrations} ${excludedPatches} ${includedPatches}`,
        { maxBuffer: 5120 * 1024 }
      );
      console.log(stdout || stderr);

      if (
        stdout.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE') ||
        stderr.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')
      ) {
        console.log(
          "Couldn't install ReVanced properly. Reinstalling ReVanced..."
        );
        await actualExec('adb uninstall app.revanced.android.youtube');
        await actualExec('adb install revanced/revanced.apk');
      }

      if (adbExists && !isRooted && foundDevice) {
        console.log('Installing MicroG...');

        await actualExec(`adb install ${jarNames.microG}`);
        await exitProcess();
      } else {
        console.log(
          'You now can install ReVanced and MicroG by transferring revanced/revanced.apk and revanced/microg.apk!'
        );
        await exitProcess();
      }

      break;
    }

    default: {
      let patches = '';
      let useManualAPK;
      let ytVersion;
      let isRooted;

      await preflight(false);

      const getPatches = await actualExec(
        `java -jar ${jarNames.cli} -a ${jarNames.integrations} -b ${jarNames.patchesJar} -l`
      );

      const patchesText = getPatches.stderr || getPatches.stdout;
      const firstWord = patchesText.slice(0, patchesText.indexOf(' '));
      const patchRegex = new RegExp(`${firstWord}\\s([^\\t]+)`, 'g');

      const patchesArray = patchesText.match(patchRegex);

      const patchDescRegex = new RegExp(`\\t(.*) ${require('os').EOL}`, 'g');
      const patchDescsArray = patchesText.match(patchDescRegex);

      const patchesChoice = [];
      let index = 0;

      for (const patchName of patchesArray) {
        let patch = patchName.replace(firstWord, '').replace(/\s/g, '');
        patch += `| ${patchDescsArray[index]
          .replace('\t', '')
          .replace(require('os').EOL, '')}`;
        if (patch.includes('microg-support')) patch += '(Root required)';
        if (patch.includes('hide-cast-button')) patch += '(Root required)';
        patchesChoice.push({
          name: patch
        });

        index++;
      }

      const patchesChoosed = await inquirer.prompt([
        {
          type: 'checkbox',
          message: 'Select the patches you want to exclude.',
          name: 'patches',
          choices: patchesChoice
        }
      ]);

      if (patchesChoice.length === patchesChoosed.patches.length) {
        throw new Error(
          'You excluded every single patch... I guess you want to use YouTube?'
        );
      }

      for (const patch of patchesChoosed.patches) {
        if (patch.includes('microg-support')) {
          if (!adbExists) {
            console.log(
              "You don't have ADB installed.\nPlease get it from here: https://developer.android.com/studio/releases/platform-tools\n"
            );
            return await exitProcess();
          }
          if (foundDevice) {
            console.log(
              'WARNING: Rooted builds might or might not work.\nKeep in mind that I (reisxd) cannot test it.'
            );
            ytVersion = await getYTVersion();
            patches += ' --mount';
            isRooted = true;
          } else {
            throw new Error(
              "Couldn't find the device. Please plug in the device."
            );
          }
        }
        const patchName = patch.replace(/\|.+(.*)$/, '');
        patches += ` -e ${patchName}`;
      }

      if (fs.existsSync('./revanced/youtube.apk') && !isRooted) {
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
        await downloadYTApk(ytVersion);
      }

      console.log('Building ReVanced, please be patient!');
      const { stdout, stderr } = await actualExec(
        `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} --experimental -a ./revanced/youtube.apk ${jarNames.deviceId} -o ./revanced/revanced.apk -m ${jarNames.integrations} ${patches}`,
        { maxBuffer: 5120 * 1024 }
      );
      console.log(stdout || stderr);

      if (
        stdout.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE') ||
        stderr.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')
      ) {
        console.log(
          "Couldn't install ReVanced properly. Reinstalling ReVanced..."
        );
        await actualExec('adb uninstall app.revanced.android.youtube');
        await actualExec('adb install revanced/revanced.apk');
      }

      if (adbExists && !isRooted && foundDevice) {
        console.log('Installing MicroG...');

        await actualExec(`adb install ${jarNames.microG}`);
        await exitProcess();
      } else {
        console.log(
          'You now can install ReVanced and MicroG by transferring revanced/revanced.apk and revaned/microg.apk!'
        );
        await exitProcess();
      }

      break;
    }
  }
})();
