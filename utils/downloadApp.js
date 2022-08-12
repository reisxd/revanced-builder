const fetchURL = require('node-fetch');
const { load } = require('cheerio');
const { dloadFromURL } = require('./FileDownloader.js');

module.exports = async function (ws) {
  const { version, arch } = global.apkInfo;
  const apkMirrorVersionArg = version.replace(/\./g, '-');

  let versionDownload;

  switch (global.jarNames.selectedApp) {
    case 'youtube': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${apkMirrorVersionArg}-release/`
      );
      break;
    }

    case 'music': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/google-inc/youtube-music/youtube-music-${apkMirrorVersionArg}-release/`
      );
      break;
    }

    case 'android': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/twitter-inc/twitter/twitter-${apkMirrorVersionArg}-release/`
      );
      break;
    }

    case 'frontpage': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/redditinc/reddit/reddit-${apkMirrorVersionArg}-release/`
      );
      break;
    }

    case 'warnapp': {
      versionDownload = await fetchURL(
        `https://www.apkmirror.com/apk/deutscher-wetterdienst/warnwetter/warnwetter-${apkMirrorVersionArg}-release/`
      );
      break;
    }
  }

  if (!versionDownload.ok) {
    return ws.send(
      JSON.stringify({
        event: 'error',
        error: `Failed to scrape download link for ${version}.<br>Please try downgrading.`
      })
    );
  }

  const versionDownloadList = await versionDownload.text();

  const vDLL = load(versionDownloadList);
  let dlLink;
  if (arch && global.jarNames.selectedApp === 'music') {
    dlLink = vDLL(`div:contains("${arch}")`)
      .parent()
      .children('div[class^="table-cell rowheight"]')
      .first()
      .children('a[class="accent_color"]')
      .first()
      .attr('href');
  } else {
    dlLink = vDLL('span[class="apkm-badge"]')
      .first()
      .parent()
      .children('a[class="accent_color"]')
      .first()
      .attr('href');
  }

  const downloadLink = await fetchURL(`https://www.apkmirror.com${dlLink}`);
  const downloadLinkPage = await downloadLink.text();

  const dlPage = load(downloadLinkPage);
  const pageLink = dlPage('a[class^="accent_bg btn btn-flat downloadButton"]')
    .first()
    .attr('href');
  const download = await fetchURL(`https://www.apkmirror.com${pageLink}`);
  const downloadPage = await download.text();
  const apkPage = load(downloadPage);
  const apkLink = apkPage('a[rel="nofollow"]').first().attr('href');

  await dloadFromURL(
    `https://www.apkmirror.com${apkLink}`,
    `./revanced/${global.jarNames.selectedApp}.apk`,
    ws
  );

  return ws.send(
    JSON.stringify({
      event: 'finished'
    })
  );
};
