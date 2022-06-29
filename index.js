import fetchURL from 'node-fetch';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import cheerio from 'cheerio';
import opteric from './opteric.mjs';

const argParser = opteric(process.argv.join(' '));
const actualExec = util.promisify(exec);

const jarNames = {
    cli: null,
    patchesJar: null,
    integrations: null,
    deviceId: null
}

async function overWriteJarNames(link) {
    const fileName = link.split('/').pop();
    // i have to use ifs for this sorry
    if (fileName.includes('revanced-cli')) jarNames.cli = fileName;
    if (fileName.includes('revanced-patches') && fileName.endsWith('.jar')) jarNames.patchesJar = fileName;
    if (fileName.endsWith('.apk')) jarNames.integrations = fileName;
}

async function getDownloadLink(repoName) {
    const apiRequest = await fetchURL(`https://api.github.com/repos/revanced/${repoName}/releases/latest`);
    const jsonResponse = await apiRequest.json();
    return jsonResponse.assets;
}

async function getPage(pageUrl) {
    const pageRequest = await fetchURL(pageUrl, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        }
    });
    return await pageRequest.text();
}
async function downloadYTApk() {
    const versionsList = await getPage('https://www.apkmirror.com/apk/google-inc/youtube');
    const $ = cheerio.load(versionsList);
    const apkVersionText = $('h5[class="appRowTitle wrapText marginZero block-on-mobile"]').first().attr('title');
    const apkVersion = apkVersionText.replace('YouTube ', '').replace(/\./g, '-');
    const downloadLinkPage = await getPage(`https://www.apkmirror.com/apk/google-inc/youtube/youtube-${apkVersion}-release/youtube-${apkVersion}-android-apk-download/`);
    const dlPage = cheerio.load(downloadLinkPage);
    const pageLink = dlPage('a[rel="nofollow"]').get()[1].attribs.href;//||dlPage('a').filter((_, selector) => dlPage(selector).attr('class').startsWith('accent_bg btn btn-flat downloadButton')).first().attr('href');
    const downloadPage = await getPage(`https://www.apkmirror.com${pageLink}`);
    const apkPage = cheerio.load(downloadPage);
    const apkLink = apkPage('a[rel="nofollow"]').first().attr('href');
    const downloadRequest = await fetchURL(`https://www.apkmirror.com${apkLink}`);
    const file = fs.createWriteStream('youtube.apk');
    console.log('Downloading the YouTube APK, this\'ll take some time!')
    const stream = downloadRequest.body.pipe(file);
    await new Promise((resolve) => {
        stream.once('finish', () => resolve());
    });
    return;
}
async function downloadFile(assets) {
    for (const asset of assets) {
        const dir = fs.readdirSync('./');
        overWriteJarNames(asset.browser_download_url);
        if (dir.includes(asset.browser_download_url.split('/').pop())) continue;
        const downloadRequest = await fetchURL(asset.browser_download_url);
        const file = fs.createWriteStream(asset.browser_download_url.split('/').pop());
        await downloadRequest.body.pipe(file);
    }
}

async function downloadFiles(repos) {
    for (const repo of repos) {
        const downloadLink = await getDownloadLink(repo);
        await downloadFile(downloadLink);
    }
}

async function getADBDeviceID() {
    let deviceId;
    const { stdout, stderr } = await actualExec('adb devices');
    const match = stdout.match(/^(\w+)\s+device$/m);
    if (match === null) {
        console.log('No device found! Fallback to only build.');
        return jarNames.deviceId = ''
    }

    const [deviceIdN] = match;
    jarNames.deviceId = `-d ${deviceIdN.replace('device', '')} -c`
    return deviceId;
}
switch (argParser.flags[0]) {
    case 'patches': {
        console.log('Downloading latest patches and cli...');
        const filesToDownload = ['revanced-cli', 'revanced-patches'];
        await downloadFiles(filesToDownload);
        exec(`java -jar ${jarNames.cli} -b ${jarNames.patchesJar} -l`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(stdout);
            console.error(stderr);
        });
        break;
    }

    case 'patch': {
        console.log('Downloading latest patches, integrations and cli...');
        const filesToDownload = ['revanced-cli', 'revanced-patches', 'revanced-integrations'];
        await downloadFiles(filesToDownload);
        await downloadYTApk();
        await getADBDeviceID();
        let excludedPatches = '';
        if (argParser.options.exclude) {
            for (const patch of argParser.options.exclude.split(',')) {
                excludedPatches = `-e ${patch}`;
            }
        }
        console.log('a');
        const { stdout, stderr } = await actualExec(`java -jar ${jarNames.cli} -b ${jarNames.patchesJar} --experimental -a youtube.apk ${jarNames.deviceId} -o revanced.apk -m ${jarNames.integrations} ${excludedPatches}`);
       console.log(stdout, stderr)
        if (stdout.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE') ||stderr.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
            console.log('Couldn\'t install ReVanced properly. Reinstalling ReVanced...');
            await actualExec('adb uninstall app.revanced.android.youtube');
            await actualExec('adb install revanced.apk');
        }
        break;
    }
}