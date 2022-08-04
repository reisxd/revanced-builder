import fetchURL from 'node-fetch';
import { load } from 'cheerio';
import { dloadFromURL } from '../utils/FileDownlader.js';

export default async function (version, ws) {
  const apkVersion = version.replace(/\./g, '-');

  let versionDownload;

  switch (global.jarNames.selectedApp) {
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
}
