const { QLabel, QProgressBar } = require('@nodegui/nodegui');
const { exec } = require('child_process');
const util = require('util');
const { deleteWidgets } = require('./index.js');
const fetchURL = require('../../node_modules/node-fetch/lib/index.js');
const fs = require('fs');
const Progress = require('node-fetch-progress');
const {
  patchesScreen,
  appVerSelector,
  patchingScreen,
  errorScreen
} = require('../ui/index.js');
const { load } = require('cheerio');

const actualExec = util.promisify(exec);

let ui;
let widgetsArray = [];
global.widgetsArray = widgetsArray;
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
  foundDevice: false,
  downloadedAPK: ''
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

    if (!javaVerLog.includes('openjdk')) {
      return errorScreen(
        'You have Java, but not OpenJDK. You need to install it because of signing problems.\nPlease get it from here:\n\thttps://jdk.java.net/archive/\nDownload the zip/tar.gz for your OS under "17.0.2 (build 17.0.2+8)"',
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

async function getAppVersion (pkgName) {
  const { stdout, stderr } = await actualExec(
    `adb shell dumpsys package ${pkgName}`,
    { maxBuffer: 10240 * 1024 }
  );
  const dumpSysOut = stdout || stderr;
  if (!dumpSysOut.match(/versionName=([^=]+)/)) {
    deleteWidgets(widgetsArray);
    errorScreen(
      "The app you selected is not installed on your device\nIt's needed for rooted ReVanced.",
      ui
    );
    return null;
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

async function excludePatches (ui, pkg) {
  vars.downloadedAPK = pkg;
  const getPatches = await actualExec(
    `java -jar ${jarNames.cli} -a ${jarNames.integrations} -b ${jarNames.patchesJar} -l --with-packages`,
    { maxBuffer: 5120 * 1024 }
  );

  let patchesText = getPatches.stdout;
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
        vars.downloadedAPK = pkg;
        break;
      }
      case 'youtube': {
        pkg = 'com.google.android.youtube';
        vars.downloadedAPK = pkg;
        break;
      }
      case 'frontpage': {
        pkg = 'com.reddit.frontpage';
        vars.downloadedAPK = pkg;
        break;
      }
      case 'music': {
        pkg = 'com.google.android.apps.youtube.music';
        vars.downloadedAPK = pkg;
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
    if (pkgNameArray[index].replace(firstWord, '').replace(/\s/g, '') !== pkg) {
      continue;
    }
    patch += ` | ${
      patchDescsArray[index]
        .replace('\t', '')
        .match(new RegExp(`\\t(.*) ${require('os').EOL}`))[1]
    }`;
    if (patch.includes('microg-support')) patch += '(Root required to exclude)';
    if (patch.includes('hide-cast-button')) {
      patch += '(Root required to exclude)';
    }
    patchesChoice.push(patch);
  }
  patchesScreen(patchesChoice, ui, vars, widgetsArray, pkg, patchesArray, pkgNameArray, firstWord);
}

async function getAppVersions (version, app) {
  if (app && version != null) return downloadAPK(version, app);
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
    versionList.push(versionName);
  }
  appVerSelector(versionList, ui, versionChoosen, widgetsArray, app);
}

async function downloadAPK (apkVersion, app) {
  let versionDownload;
  const appVersion = apkVersion.toLowerCase().replace(/\./g, '-');
  switch (app) {
    case 'youtube': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${appVersion}-release/`
      );
      break;
    }

    case 'music': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/google-inc/youtube-music/youtube-music-${appVersion}-release/`
      );
      break;
    }

    case 'android': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/twitter-inc/twitter/twitter-${appVersion}-release/`
      );
      break;
    }

    case 'frontpage': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/redditinc/reddit/reddit-${appVersion}-release/`
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
  vars.downloadedAPK = app;
  await dloadFromURL(
    `https://www.apkmirror.com${apkLink}`,
    `./revanced/${app}.apk`
  );
  return await buildReVanced();
}

async function buildReVanced () {
  deleteWidgets(widgetsArray);
  const buildProcess = await exec(
    `java -jar ${jarNames.cli} -b ${
      jarNames.patchesJar
    } --experimental -a ./revanced/${vars.downloadedAPK}.apk ${
      jarNames.deviceId
    } -o ./revanced/revanced.apk ${
      vars.downloadedAPK === 'frontpage' ? '-r' : ''
    } -m ${jarNames.integrations} ${vars.patches}`,
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
  getAppVersions,
  downloadAPK,
  getAppVersion,
  buildReVanced
};
