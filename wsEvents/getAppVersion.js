const { EOL } = require('node:os');

const exec = require('../utils/promisifiedExec.js');

const fetch = require('../utils/fetch.js');
const { load } = require('cheerio');
const semver = require('semver');

const getAppVersion_ = require('../utils/getAppVersion.js');
const downloadApp = require('../utils/downloadApp.js');

const APKMIRROR_UPLOAD_BASE = 'https://www.apkmirror.com/uploads/?appcategory=';

/**
 * @param {string} ver
 */
const sanitizeVersion = (ver) => {
  return ver
    .replace(/\.0(\d)/gi, '.$1') // because apparently x.0y.z (ex. 5.09.51) isn't a valid version
    .replace(/^(\d+)\.(\d+)$/gi, '$1.$2.0'); // nor are versions without a patch (ex. 2.3)
};

/**
 * @param {string} url
 * @returns
 */
async function getPage(url) {
  return fetch(url).then((res) => res.text());
}

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function getAppVersion(ws) {
  let versionsList;

  if (global.jarNames.isRooted) {
    if (process.platform !== 'android') {
      if (!global.jarNames.deviceID) {
        ws.send(
          JSON.stringify({
            event: 'error',
            error:
              "You either don't have a device plugged in or don't have ADB installed."
          })
        );

        return;
      }

      try {
        await exec(`adb -s ${global.jarNames.deviceID} shell su -c exit`);
      } catch {
        ws.send(
          JSON.stringify({
            event: 'error',
            error:
              'The plugged in device is not rooted or Shell was denied root access. If you didn\'t intend on doing a rooted build, include all "Root required to exclude" patches'
          })
        );

        return;
      }
    }

    /** @type {string} */
    let pkgName;

    switch (global.jarNames.selectedApp) {
      case 'youtube':
        pkgName = 'com.google.android.youtube';
        break;
      case 'music':
        pkgName = 'com.google.android.apps.youtube.music';
    }

    const appVersion = await getAppVersion_(pkgName, ws, true);

    if (global.jarNames.selectedApp === 'music') {
      const deviceArch = await exec(
        process.platform !== 'android'
          ? `adb -s ${global.jarNames.deviceID} shell getprop ro.product.cpu.abi`
          : 'getprop ro.product.cpu.abi'
      );

      global.apkInfo = {
        version: appVersion,
        arch: deviceArch.stdout.replace(EOL, '')
      };

      return downloadApp(ws);
    } else {
      global.apkInfo = {
        version: appVersion,
        arch: null
      };

      return downloadApp(ws);
    }
  }

  switch (global.jarNames.selectedApp) {
    case 'youtube':
      versionsList = await getPage(`${APKMIRROR_UPLOAD_BASE}youtube`);
      break;
    case 'music':
      versionsList = await getPage(`${APKMIRROR_UPLOAD_BASE}youtube-music`);
      break;
    case 'android':
      versionsList = await getPage(`${APKMIRROR_UPLOAD_BASE}twitter`);
      break;
    case 'frontpage':
      versionsList = await getPage(`${APKMIRROR_UPLOAD_BASE}reddit`);
      break;
    case 'warnapp':
      versionsList = await getPage(`${APKMIRROR_UPLOAD_BASE}warnwetter`);
      break;
    case 'trill':
      versionsList = await getPage(`${APKMIRROR_UPLOAD_BASE}tik-tok`);
  }

  /** @type {{ version: string; recommended: boolean; beta: boolean }[]} */
  const versionList = [];
  const $ = load(versionsList);

  for (const version of $(
    '#primary h5.appRowTitle.wrapText.marginZero.block-on-mobile'
  ).get()) {
    const versionName = version.attribs.title
      .replace('YouTube ', '')
      .replace('Music ', '')
      .replace('Twitter ', '')
      .replace('Reddit ', '')
      .replace('WarnWetter ', '')
      .replace('TikTok ', '');

    if (
      (global.jarNames.selectedApp === 'android' &&
        !versionName.includes('release')) ||
      versionName.includes('(Wear OS)')
    )
      continue;

    const splitVersion = versionName.split(' ');

    versionList.push({
      version: splitVersion[0], // remove beta suffix if there is one.
      recommended: global.versions.includes(splitVersion[0]),
      beta: !!splitVersion[1]
    });
  }

  versionList.sort((a, b) =>
    semver.lt(sanitizeVersion(a.version), sanitizeVersion(b.version)) ? 1 : -1
  );

  ws.send(
    JSON.stringify({
      event: 'appVersions',
      versionList,
      selectedApp: global.jarNames.selectedApp,
      foundDevice: global.jarNames.deviceID
        ? true
        : process.platform === 'android'
    })
  );
};
