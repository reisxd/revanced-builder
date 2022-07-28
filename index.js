const fetchURL = require('node-fetch');
const Progress = require('node-fetch-progress');
const { SingleBar: ProgressBar, Presets } = require('cli-progress');
const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const { load } = require('cheerio');
const opteric = require('./opteric.js');
const inquirer = require('inquirer');
const os = require('os');

const argParser = opteric(process.argv.join(' '));
const actualExec = util.promisify(exec);

let adbExists = true;
let foundDevice = false;
const jarNames = {
  cli: '',
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
  if (fileName.includes('revanced-cli')) {
    jarNames.cli = `./revanced/${fileName}`;
  }
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

async function downloadAppApk (ytVersion, app) {
  let versionsList;

  switch (app) {
    case 'youtube': {
      versionsList = await getPage(
        'https://www.apkmirror.com/apk/google-inc/youtube'
      );
      break;
    }
    case 'music': {
      versionsList = await getPage(
        'https://www.apkmirror.com/apk/google-inc/youtube-music'
      );
      break;
    }
    case 'android': {
      versionsList = await getPage(
        'https://www.apkmirror.com/apk/twitter/twitter'
      );
      break;
    }
    case 'frontpage': {
      versionsList = await getPage(
        'https://www.apkmirror.com/apk/redditinc/reddit'
      );
      break;
    }
  }

  const versionList = [];
  let indx = 0;
  let versionChoosen;
  const $ = load(versionsList);

  if (!ytVersion) {
    for (const version of $(
      'h5[class="appRowTitle wrapText marginZero block-on-mobile"]'
    ).get()) {
      if (indx === 10) continue;
      const versionName = version.attribs.title
        .replace('YouTube ', '')
        .replace('Music ', '')
        .replace('Twitter ', '')
        .replace('Reddit ', '');

      indx++;
      if (versionName.includes('beta')) continue;
      else if (app === 'android' && !versionName.includes('release')) continue;
      if (versionName.includes('(Wear OS)')) continue;
      versionList.push({
        name: versionName
      });
    }

    versionChoosen = await inquirer.prompt([
      {
        type: 'list',
        name: 'version',
        message: 'Select the version to download.',
        choices: versionList
      }
    ]);
  }
  let apkVersion;

  if (ytVersion) apkVersion = ytVersion.replace(/\./g, '-');
  if (versionChoosen) apkVersion = versionChoosen.version.replace(/\./g, '-');

  let versionDownload;

  switch (app) {
    case 'youtube': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${apkVersion}-release/`
      );
      break;
    }

    case 'music': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/google-inc/youtube-music/youtube-music-${apkVersion}-release/`
      );
      break;
    }

    case 'android': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/twitter-inc/twitter/twitter-${apkVersion}-release/`
      );
      break;
    }

    case 'frontpage': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/redditinc/reddit/reddit-${apkVersion}-release/`
      );
      break;
    }
  }
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

  console.log("Downloading the APK, this'll take some time!");
  await dloadFromURL(
    `https://www.apkmirror.com${apkLink}`,
    `./revanced/${app}.apk`
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
  const adbDeviceIdRegex = new RegExp(`${os.EOL}(.*?)\t`);
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

    /* if (!javaVerLog.includes('Zulu')) {
       console.log(
         'You have Java, but not Zulu JDK. You need to install it because of signing problems.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
       );

       return await exitProcess();

     }
     */
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
    .replace(`${os.EOL}    `, '')
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
    }
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
    if (os.platform() === 'android') {
      await androidBuild();
    } else {
      await checkForJavaADB();
      if (adbExists) {
        await getADBDeviceID();
      }
    }
  }
}

async function androidBuild () {
  console.log(
    'revanced-builder has detected that you are using Android (Termux)!'
  );
  try {
    await actualExec('java -v');
  } catch (e) {
    if (!e.stderr.includes('not found')) {
      console.log('JDK is already installed.');
    } else {
      console.log("Couldn't find JDK, installing...");
      await actualExec('apt install openjdk-17');
    }
  }
  process.stdout.write('Checking for aapt2... ');
  if (fs.existsSync('revanced/aapt2')) {
    console.log('aapt2 is already installed.');
  } else {
    console.log('Installing aapt2');
    await dloadFromURL(
      'https://github.com/reisxd/revanced-cli-termux/raw/main/aapt2.zip',
      'aapt2.zip'
    );
    console.log(`The architecture is ${os.arch()}`);
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

    console.log('aapt2 has been installed.');
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
        await downloadAppApk(ytVersion);
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
      let pkg;

      await preflight(false);

      const selectedPkg = await inquirer.prompt([
        {
          type: 'list',
          name: 'appToSelect',
          message: 'Select what app you want to patch:',
          choices: ['YouTube', 'YouTube Music', 'Twitter', 'Reddit']
        }
      ]);

      switch (selectedPkg.appToSelect) {
        case 'YouTube': {
          pkg = 'youtube';
          break;
        }
        case 'YouTube Music': {
          pkg = 'music';
          break;
        }
        case 'Twitter': {
          pkg = 'android';
          break;
        }
        case 'Reddit': {
          pkg = 'frontpage';
          break;
        }
      }
      const getPatches = await actualExec(
        `java -jar ${jarNames.cli} -a ${jarNames.integrations} -b ${jarNames.patchesJar} -l`
      );
      let patchesText = getPatches.stderr || getPatches.stdout;
      patchesText = patchesText.replace('\tdi', '\t di');
      const firstWord = patchesText.slice(0, patchesText.indexOf(' '));
      const patchRegex = new RegExp('\\t\\s([^\\t]+)', 'g');

      const patchesArray = patchesText.match(patchRegex);

      const pkgRegex = new RegExp(`${firstWord}\\s([^\\t]+)`, 'g');
      const pkgNameArray = patchesText.match(pkgRegex);
      if (pkgNameArray.includes('com.twitter.android')) {
        switch (pkg) {
          case 'android': {
            pkg = 'com.twitter.android';
            break;
          }
          case 'youtube': {
            pkg = 'com.google.android.youtube';
            break;
          }
          case 'frontpage': {
            pkg = 'com.reddit.frontpage';
            break;
          }
          case 'music': {
            pkg = 'com.google.android.apps.youtube.music';
            break;
          }
        }
      }
      const patchDescRegex = new RegExp(`\\t(.*) ${require('os').EOL}`, 'g');
      const patchDescsArray = patchesText.match(patchDescRegex);

      const patchesChoice = [];
      let index = -1;

      for (const patchName of patchesArray) {
        let patch = patchName.replace(firstWord, '').replace(/\s/g, '');
        index++;
        if (
          pkgNameArray[index].replace(firstWord, '').replace(/\s/g, '') !== pkg
        ) {
          continue;
        }
        patch += ` | ${
          patchDescsArray[index]
            .replace('\t', '')
            .match(new RegExp(`\\t(.*) ${require('os').EOL}`))[1]
        }`;
        if (patch.includes('microg-support')) {
          patch += '(Root required to exclude)';
        }
        if (patch.includes('hide-cast-button')) {
          patch += '(Root required to exclude)';
        }
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
          } else if (os.platform() === 'android') {
            throw new Error("Rooted builds on Android isn't supported yet.");
          } else {
            throw new Error(
              "Couldn't find the device. Please plug in the device."
            );
          }
        }
        const patchName = patch.replace(/\|.+(.*)$/, '');
        patches += ` -e ${patchName}`;
      }

      if (fs.existsSync(`./revanced/${pkg}.apk`) && !isRooted) {
        const useManualAPKAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useManualAPK',
            message:
              'The APK already exists in the revanced folder. Do you want to use it?',
            default: false
          }
        ]);
        useManualAPK = useManualAPKAnswer.useManualAPK;
      }

      if (!useManualAPK) {
        await downloadAppApk(ytVersion, pkg);
      }

      console.log('Building ReVanced, please be patient!');
      const { stdout, stderr } = await actualExec(
        `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} ${
          os.platform() === 'android'
            ? '--custom-aapt2-binary revanced/aapt2'
            : ''
        } -t ./revanced-cache --experimental -a ./revanced/${pkg}.apk ${
          jarNames.deviceId
        } -o ./revanced/revanced.apk ${
          pkg.endsWith('frontpage') ? '-r' : ''
        } -m ${jarNames.integrations} ${patches}`,
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
      } else if (os.platform() === 'android') {
        console.log('Copying ReVanced and MicroG to phones storage...');

        await actualExec(
          'cp revanced/revanced.apk /storage/emulated/0/revanced.apk'
        );
        await actualExec(
          'cp revanced/microg.apk /storage/emulated/0/microg.apk'
        );

        console.log(
          'You now can install ReVanced and MicroG! Check /storage/emulated/0/'
        );

        await exitProcess();
      } else {
        console.log(
          'You now can install ReVanced and MicroG by transferring revanced/revanced.apk and revanced/microg.apk!'
        );

        await exitProcess();
      }

      break;
    }
  }
})();
