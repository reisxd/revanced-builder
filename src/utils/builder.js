const { QLabel, QProgressBar } = require('@nodegui/nodegui');
const { exec } = require('child_process');
const util = require('util');
const { deleteWidgets } = require('./index.js');
const fetchURL = require('../../node_modules/node-fetch/lib/index.js');
const fs = require('fs');
const Progress = require('node-fetch-progress');
const {
  patchesScreen,
  ytVerSelector,
  patchingScreen,
  errorScreen
} = require('../ui/index.js');
const { load } = require('cheerio');

const actualExec = util.promisify(exec);

let ui;
let widgetsArray = [];
const jarNames = {
  cli: './revanced/',
  patchesJar: './revanced/',
  integrations: './revanced/',
  deviceId: '',
  microG: './revanced/'
};

const vars = {
  patches: '',
  isRooted: false,
  adbExists: true,
  foundDevice: false
};

async function getADBDeviceID () {
  let deviceId;
  const { stdout } = await actualExec('adb devices');
  const adbDeviceIdRegex = new RegExp(`${require('os').EOL}(.*?)\t`);
  const match = stdout.match(adbDeviceIdRegex);
  if (match === null) {
    return;
  }

  const deviceIdN = match[1];
  jarNames.deviceId = `-d ${deviceIdN} -c`;
  vars.foundDevice = true;
  return deviceId;
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

async function overWriteJarNames (link) {
  const fileName = link.split('/').pop();
  if (fileName.includes('revanced-cli')) jarNames.cli += fileName;
  if (fileName.includes('revanced-patches') && fileName.endsWith('.jar')) {
    jarNames.patchesJar += fileName;
  }
  if (fileName.endsWith('unsigned.apk')) jarNames.integrations += fileName;
  if (fileName.startsWith('microg')) jarNames.microG += fileName;
}

async function preflight (listOnly, gLayout) {
  ui = gLayout;
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
    await checkForJavaADB(gLayout);
    if (vars.adbExists) {
      await getADBDeviceID();
    }
  }
}

async function downloadFiles (repos) {
  for (const repo of repos) {
    const downloadLink = await getDownloadLink(repo);
    await downloadFile(downloadLink);
  }
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
      return errorScreen(
        'You got ratelimited from GitHub\n...Completely? What did you even do?',
        ui
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

async function checkForJavaADB () {
  deleteWidgets(widgetsArray);
  ui.labels.main.setText('Checking system requirements...');
  try {
    const javaCheck = await actualExec('java -version');
    const javaVerLog = javaCheck.stderr || javaCheck.stdout;
    const javaVer = Array.from(javaVerLog.matchAll(/version\s([^:]+)/g))
      .map((match) => match[1])[0]
      .match(/"(.*)"/)[1];
    if (javaVer.split('.')[0] < 17) {
      return errorScreen(
        'You have an outdated version of JDK.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk',
        ui
      );
    }

    if (!javaVerLog.includes('Zulu')) {
      return errorScreen(
        'You have Java, but not Zulu JDK. You need to install it because of signing problems.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk',
        ui
      );
    }
    await actualExec('adb');
  } catch (e) {
    if (e.stderr.includes('java')) {
      return errorScreen(
        "You don't have JDK installed.\nPlease get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk",
        ui
      );
    }
    if (e.stderr.includes('adb')) {
      vars.adbExists = false;
    }

    return deleteWidgets(widgetsArray);
  }
}

async function getYTVersion () {
  const { stdout, stderr } = await actualExec(
    'adb shell dumpsys package com.google.android.youtube'
  );
  const dumpSysOut = stdout || stderr;
  if (!dumpSysOut.match(/versionName=([^=]+)/)) {
    deleteWidgets(widgetsArray);
    return errorScreen(
      "YouTube is not installed on your device\nIt's needed for rooted ReVanced.",
      ui
    );
  }
  return dumpSysOut
    .match(/versionName=([^=]+)/)[1]
    .replace(`${require('os').EOL}    `, '')
    .match(/[\d]+(\.\d+)+/g)[0];
}

async function dloadFromURL (url, outputPath) {
  deleteWidgets(widgetsArray);

  ui.labels.main.setText('Downloading files');
  const label = new QLabel();
  label.setText(`Downloading file: ${outputPath.split('/').pop()}`);
  label.setStyleSheet(
    'font-size: 20px; font-family: "Segoe UI", serif; font-weight: 500; color: white; margin: 0;'
  );
  const progressBar = new QProgressBar();
  progressBar.setObjectName('progressBar');
  progressBar.setMinimum(0);
  progressBar.setMaximum(100);
  progressBar.setValue(0);
  progressBar.setFixedSize(250, 25);
  progressBar.setTextVisible(false);
  ui.panels.innerPanel.addWidget(label);
  ui.panels.innerPanel.addWidget(progressBar);
  widgetsArray = [label, progressBar];
  const request = await fetchURL(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    }
  });
  const writeStream = fs.createWriteStream(outputPath);
  const downloadStream = request.body.pipe(writeStream);

  const progress = new Progress(request, { throttle: 50 });

  return new Promise((resolve, reject) => {
    progress.on('progress', (p) => {
      progressBar.setValue(Math.floor(p.progress * 100));
    });
    downloadStream.once('finish', () => {
      resolve();
    });
    downloadStream.once('error', (err) => {
      fs.unlink(outputPath, () => {
        reject(new Error('Download failed.', err));
      });
    });
  });
}

async function excludePatches (ui) {
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
    patch += ` | ${patchDescsArray[index]
      .replace('\t', '')
      .replace(require('os').EOL, '')}`;
    if (patch.includes('microg-support')) patch += '(Root required)';
    if (patch.includes('hide-cast-button')) patch += '(Root required)';
    patchesChoice.push(patch);

    index++;
  }
  patchesScreen(patchesChoice, ui, vars, widgetsArray);
}

async function getYTVersions (ytVersion, isYTM) {
  if (ytVersion) return downloadYTApk(ytVersion);
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
      const versionName = version.attribs.title.replace('YouTube ', '').replace('Music ', '');
      indx++;
      if (versionName.includes('beta')) continue;
      versionList.push(versionName);
    }
    ytVerSelector(versionList, ui, versionChoosen, widgetsArray);
  }
}

async function downloadYTApk (apkVersion) {
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

  await dloadFromURL(
    `https://www.apkmirror.com${apkLink}`,
    './revanced/youtube.apk'
  );
  return await buildReVanced();
}

async function buildReVanced () {
  deleteWidgets(widgetsArray);
  const buildProcess = await exec(
    `java -jar ${jarNames.cli} -b ${jarNames.patchesJar} --experimental -a ./revanced/youtube.apk ${jarNames.deviceId} -o ./revanced/revanced.apk -m ${jarNames.integrations} ${vars.patches}`,
    { maxBuffer: 5120 * 1024 }
  );

  patchingScreen(ui, widgetsArray, buildProcess, vars);

  if (vars.adbExists && !vars.isRooted && vars.foundDevice) {
    await actualExec(`adb install ${jarNames.microG}`);
  }
}

module.exports = {
  preflight,
  excludePatches,
  getYTVersions,
  downloadYTApk,
  getYTVersion,
  buildReVanced
};
