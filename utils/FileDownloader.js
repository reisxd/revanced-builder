const { load } = require('cheerio');
const fetchURL = require('node-fetch');
const Progress = require('node-fetch-progress');
const fs = require('fs');

let ws;

async function overWriteJarNames (fileName) {
  if (fileName.includes('revanced-cli')) {
    global.jarNames.cli = `./revanced/${fileName}`;
  }
  if (fileName.includes('revanced-patches') && fileName.endsWith('.jar')) {
    global.jarNames.patchesJar = `./revanced/${fileName}`;
  }
  if (fileName.endsWith('.apk') && !fileName.startsWith('VancedMicroG')) {
    global.jarNames.integrations = `./revanced/${fileName}`;
  }
  if (fileName.startsWith('VancedMicroG')) {
    global.jarNames.microG = `./revanced/${fileName}`;
  }
}

// yes.

// function insert (str, index, value) {
//   return str.substr(0, index) + value + str.substr(index);
// }

async function getDownloadLink (json) {
  const apiRequest = await fetchURL(
    `https://api.github.com/repos/${json.owner}/${json.repo}/releases/latest`
  );
  const jsonResponse = await apiRequest.json();
  const assets = jsonResponse?.assets;
  const jsonOBJ = {
    version: jsonResponse?.tag_name,
    assets,
    repo: json.repo
  };

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

    jsonOBJ.version = $('span[class="ml-1"]').first().text().replace(/\s/g, '');
    jsonOBJ.assets = assetsGH;
  }
  return jsonOBJ;
}

async function downloadFile (assets) {
  for (const asset of assets.assets) {
    const dir = fs.readdirSync('./revanced/');
    let fileExt = asset.browser_download_url.split('/').pop().split('.');
    fileExt = fileExt[fileExt.length - 1];
    let fileName = assets.repo;
    fileName += `-${assets.version}.${fileExt}`;
    overWriteJarNames(fileName);
    if (dir.includes(fileName)) continue;
    await dloadFromURL(asset.browser_download_url, `./revanced/${fileName}`);
  }
}

async function dloadFromURL (url, outputPath, websocket) {
  if (websocket) {
    ws = websocket;
  }

  try {
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
  } catch (e) {
    global.downloadFinished = false;
    throw e;
  }
}

async function downloadFiles (repos, websocket) {
  ws = websocket;
  for (const repo of repos) {
    const downloadLink = await getDownloadLink(repo);
    await downloadFile(downloadLink);
  }
}

module.exports = { downloadFiles, dloadFromURL, getDownloadLink };
