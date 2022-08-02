import { load } from 'cheerio';
import fetchURL from 'node-fetch';
import Progress from 'node-fetch-progress';
import fs from 'fs';

let ws;

async function overWriteJarNames (link) {
  const fileName = link.split('/').pop();
  if (fileName.includes('revanced-cli')) {
    global.jarNames.cli = `./revanced/${fileName}`;
  }
  if (fileName.includes('revanced-patches') && fileName.endsWith('.jar')) {
    global.jarNames.patchesJar += fileName;
  }
  if (fileName.endsWith('unsigned.apk')) {
    global.jarNames.integrations += fileName;
  }
  if (fileName.startsWith('microg')) global.jarNames.microG += fileName;
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

async function dloadFromURL (url, outputPath, websocket) {
  if (websocket) {
    ws = websocket;
  }
  const request = await fetchURL(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    }
  });
  const writeStream = fs.createWriteStream(outputPath);
  const downloadStream = request.body.pipe(writeStream);

  ws.send(
    JSON.stringify({
      event: 'downloadingFile',
      name: outputPath.split('/').pop(),
      percentage: 0
    })
  );

  const progress = new Progress(request, { throttle: 50 });
  return new Promise((resolve, reject) => {
    progress.on('progress', (p) => {
        ws.send(
          JSON.stringify({
            event: 'downloadingFile',
            name: outputPath.split('/').pop(),
            percentage: Math.floor(p.progress * 100)
          })
        );
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

async function downloadFiles (repos, websocket) {
  ws = websocket;
  for (const repo of repos) {
    const downloadLink = await getDownloadLink(repo);
    await downloadFile(downloadLink);
  }
}

export { downloadFiles, dloadFromURL };
