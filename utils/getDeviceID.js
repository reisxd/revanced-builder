const { EOL } = require('node:os');

const exec = require('./promisifiedExec.js');

const adbDeviceIdRegex = new RegExp(`${EOL}(.*?)\t`, 'g');

module.exports = async function getDeviceID() {
  try {
    const { stdout } = await exec('adb devices');
    const matches = stdout.match(adbDeviceIdRegex);

    if (matches === null) return null;

    return matches.map((match) => match.replace(EOL, '').replace('\t', ''));
  } catch (e) {
    return null;
  }
};
