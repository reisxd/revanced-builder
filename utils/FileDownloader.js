const { readdirSync, createWriteStream, unlink } = require('node:fs');

const { load } = require('cheerio');
const fetch = require('node-fetch');
const Progress = require('node-fetch-progress');

/** @type {import('ws').WebSocket} */
let ws;

/**
 * @param {string} fileName
 */
async function overWriteJarNames(fileName) {
  if (fileName.includes('revanced-cli'))
    global.jarNames.cli = `./revanced/${fileName}`;

  if (fileName.includes('revanced-patches') && fileName.endsWith('.jar'))
    global.jarNames.patchesJar = `./revanced/${fileName}`;

  if (fileName.endsWith('.apk') && !fileName.startsWith('VancedMicroG'))
    global.jarNames.integrations = `./revanced/${fileName}`;

  if (fileName.startsWith('VancedMicroG'))
    global.jarNames.microG = `./revanced/${fileName}`;

  if (fileName.endsWith('.json'))
    global.jarNames.patchesList = `./revanced/${fileName}`;
}

/**
 * @param {Record<string, any>} json
 */
async function getDownloadLink(json) {
  const res = await fetch(
    `https://api.github.com/repos/${json.owner}/${json.repo}/releases/latest`
  );
  const latestRelease = await res.json();

  const json_ = {
    version: latestRelease?.tag_name,
    assets: latestRelease?.assets,
    repo: json.repo
  };

  if (latestRelease.error || !res.ok) {
    /** @type {{ browser_download_url: string }[]} */
    const assets = [];
    const releasesPage = await fetch(
      `https://github.com/${json.owner}/${json.repo}/releases/latest`
    );

    if (!releasesPage.ok)
      throw new Error(
        'You got ratelimited from GitHub\n...Completely? What did you even do?'
      );

    const releasePage = await releasesPage.text();
    const $ = load(releasePage);

    for (const downloadLink of $('a[data-skip-pjax=""]').get())
      if (
        !downloadLink.attribs.href.endsWith('.tar.gz') &&
        !downloadLink.attribs.href.endsWith('.zip')
      )
        assets.push({
          browser_download_url: `https://github.com${downloadLink.attribs.href}`
        });

    json_.version = $('span[class="ml-1"]').first().text().replace(/\s/g, '');
    json_.assets = assets;
  }

  return json_;
}

/**
 * @param {Record<string, any>} assets
 */
async function downloadFile(assets) {
  for (const asset of assets.assets) {
    const dir = readdirSync('revanced');

    const fileExt = asset.browser_download_url
      .split('/')
      .at(-1)
      .split('.')
      .at(-1);
    const fileName = `${assets.repo}-${assets.version}.${fileExt}`;

    overWriteJarNames(fileName);

    if (dir.includes(fileName)) continue;

    await dloadFromURL(asset.browser_download_url, `revanced/${fileName}`);
  }
}

/**
 * @param {string} url
 * @param {string} outputPath
 * @param {import('ws').WebSocket} [websocket]
 */
async function dloadFromURL(url, outputPath, websocket) {
  if (websocket != null) ws = websocket;

  try {
    const res = await fetch(url);
    const writeStream = createWriteStream(outputPath);
    const downloadStream = res.body.pipe(writeStream);

    ws.send(
      JSON.stringify({
        event: 'downloadingFile',
        name: outputPath.split('/').at(-1),
        percentage: 0
      })
    );

    const progress = new Progress(res, { throttle: 50 });

    return new Promise((resolve, reject) => {
      progress.on('progress', (p) => {
        ws.send(
          JSON.stringify({
            event: 'downloadingFile',
            name: outputPath.split('/').at(-1),
            percentage: Math.floor(p.progress * 100)
          })
        );
      });

      downloadStream.once('finish', resolve);
      downloadStream.once('error', (err) => {
        unlink(outputPath, () => {
          reject(new Error('Download failed.', err));
        });
      });
    });
  } catch (err) {
    global.downloadFinished = false;

    throw err;
  }
}

/**
 * @param {Record<string, any>[]} repos
 * @param {import('ws').WebSocket} websocket
 */
async function downloadFiles(repos, websocket) {
  ws = websocket;

  for (const repo of repos) {
    const downloadLink = await getDownloadLink(repo);

    await downloadFile(downloadLink);
  }
}

module.exports = { downloadFiles, dloadFromURL, getDownloadLink };
