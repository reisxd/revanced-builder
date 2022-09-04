const { EOL } = require('node:os');
const exec = require('./promisifiedExec.js');

async function getDeviceArch_(ws, deviceId) {
  try {
    const deviceArch = await exec(
      process.platform !== 'android'
        ? `adb -s ${deviceId} shell getprop ro.product.cpu.abi`
        : 'getprop ro.product.cpu.abi'
    );

    return deviceArch.stdout.replace(EOL, '');
  } catch (e) {
    ws.send(
      JSON.stringify({
        event: 'error',
        error:
          'Failed to get device architecture, please see console for the error.'
      })
    );

    throw e;
  }
}

module.exports = async function getDeviceArch(ws) {
  if (process.platform === 'android') return await getDeviceArch_(ws);

  const architectures = [];
  for (const deviceId of global.jarNames.devices) {
    const arch = await getDeviceArch_(ws, deviceId);

    architectures.push(arch);
  }

  if (architectures.every((arch) => arch === architectures[0])) {
    return architectures[0];
  } else {
    return ws.send(
      JSON.stringify({
        event: 'error',
        error: `The devices you're trying to install ReVanced doesn't have the same architecture. Please patch some devices seperately.`
      })
    );
  }
};
