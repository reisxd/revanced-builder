const exec = require('../utils/promisifiedExec.js');

const fetch = require('node-fetch');
const { load } = require('cheerio');
const semver = require('semver');

const { getAppVersion: getAppVersion_ } = require('../utils/getAppVersion.js');
const { downloadApp: downloadApp_ } = require('../utils/downloadApp.js');
const getDeviceArch = require('../utils/getDeviceArch.js');

const APKMIRROR_UPLOAD_BASE = 'https://www.apkmirror.com/uploads/?appcategory=';

/**
 * @param {string} ver
 */
const sanitizeVersion = (ver) => {
  while (ver.match(/\./g).length > 2) ver = ver.replace(/.([^.]*)$/, '$1');

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

async function downloadApp(ws, message) {
  if (message.useVer) return await downloadApp_(ws);
  else if (message.checkVer) {
    if (global.versions.includes(global.apkInfo.version))
      return await downloadApp_(ws);

    return ws.send(
      JSON.stringify({
        event: 'askRootVersion'
      })
    );
  } else
    return ws.send(
      JSON.stringify({
        event: 'error',
        error:
          'You did not choose to use the non recommended version. Please downgrade.'
      })
    );
}

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function getAppVersion(ws, message) {
  let versionsList = await getPage(
    `${APKMIRROR_UPLOAD_BASE}${global.jarNames.selectedApp.link.split('/')[3]}`
  );

  if (global.jarNames.isRooted) {
    if (process.platform !== 'android') {
      if (!(global.jarNames.devices && global.jarNames.devices[0])) {
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
        for (const deviceId of global.jarNames.devices) {
          await exec(`adb -s ${deviceId} shell su -c exit`);
        }
      } catch {
        ws.send(
          JSON.stringify({
            event: 'error',
            error:
              'The plugged in device is not rooted or Shell was denied root access. If you didn\'t intend on doing a rooted build, include all "Needed for non-root building" patches'
          })
        );

        return;
      }
    }

    const appVersion = await getAppVersion_(
      global.jarNames.selectedApp.packageName,
      ws,
      true
    );

    if (
      global.jarNames.selectedApp.packageName ===
      'com.google.android.apps.youtube.music'
    ) {
      const arch = await getDeviceArch(ws);

      global.apkInfo = {
        version: appVersion,
        arch
      };

      return downloadApp(ws, message);
    } else {
      global.apkInfo = {
        version: appVersion,
        arch: null
      };

      return downloadApp(ws, message);
    }
  }

  /** @type {{ version: string; recommended: boolean; beta: boolean }[]} */
  const versionList = [];
  const $ = load(versionsList);
  const link = global.jarNames.selectedApp.link;
  const regex = new RegExp(
    `(?<=${link}${link.split('/')[3]}-)(.*)(?=-release/)`
  );

  for (const version of $(
    '#primary h5.appRowTitle.wrapText.marginZero.block-on-mobile'
  ).get()) {
    const versionTitle = version.attribs.title.toLowerCase();
    const versionName = version.children[0].next.attribs.href
      .match(regex)[0]
      .replace(/-/g, '.');

    if (
      (global.jarNames.selectedApp.packageName === 'com.twitter.android' &&
        !versionTitle.includes('release')) ||
      versionTitle.includes('(Wear OS)') ||
      versionTitle.includes('-car_release')
    )
      continue;

    versionList.push({
      version: versionName,
      recommended:
        global.versions !== 'NOREC'
          ? global.versions.includes(versionName)
          : 'NOREC',
      beta: versionTitle.includes('beta')
    });
  }
  if (versionList.every((el) => /^[0-9.]*$/g.test(el.version))) {
    versionList.sort((a, b) =>
      semver.lt(sanitizeVersion(a.version), sanitizeVersion(b.version)) ? 1 : -1
    );
  }

  ws.send(
    JSON.stringify({
      event: 'appVersions',
      versionList,
      selectedApp: global.jarNames.selectedApp.packageName,
      foundDevice:
        global.jarNames.devices && global.jarNames.devices[0]
          ? true
          : process.platform === 'android'
    })
  );
};
