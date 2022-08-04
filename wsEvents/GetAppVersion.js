const fetchURL = require('node-fetch');
const { load } = require('cheerio');
const os = require('os');
const getAppVersion = require('../utils/getAppVersion.js');
const downloadApp = require('../utils/downloadApp.js');

async function getPage(pageUrl) {
  const pageRequest = await fetchURL(pageUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    }
  });
  return await pageRequest.text();
}

module.exports = async function (message, ws) {
  let versionsList;
  let localAppVersion;

  if (global.jarNames.isRooted && os.platform() !== 'android') {
    if (!global.jarNames.deviceID) {
      return ws.send(
        JSON.stringify({
          event: 'error',
          error:
            "You either don't have a device plugged in or don't have ADB installed."
        })
      );
    }

    let pkgName;
    switch (global.jarNames.selectedApp) {
      case 'youtube': {
        pkgName = 'com.google.android.youtube';
        break;
      }
      case 'music': {
        pkgName = 'com.google.android.apps.youtube.music';
        break;
      }
    }

    localAppVersion = await getAppVersion(pkgName);
    return ws.send(
      JSON.stringify({
        event: 'appVersions',
        versionList: [{ version: localAppVersion }]
      })
    );
  }

  switch (global.jarNames.selectedApp) {
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
    else if (
      global.jarNames.selectedApp === 'android' &&
      !versionName.includes('release')
    ) {
      continue;
    }
    if (versionName.includes('(Wear OS)')) continue;
    versionList.push({
      version: versionName
    });
  }

  return ws.send(
    JSON.stringify({
      event: 'appVersions',
      versionList
    })
  );
};
