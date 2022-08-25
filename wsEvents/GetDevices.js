const getDeviceID = require('../utils/getDeviceID.js');
const { promisify } = require('util');
const { exec } = require('child_process');
const actualExec = promisify(exec);
const os = require('os');

module.exports = async function (message, ws) {
  const deviceIds = await getDeviceID();
  const devices = [];

  for (const device of deviceIds) {
    try {
      const getDeviceModel = await actualExec(
        `adb -s ${device} shell getprop ro.product.model`
      );
      const model = getDeviceModel.stdout.replace(os.EOL, '');

      devices.push({
        id: device,
        model
      });
    } catch (e) {
      devices.push({
        id: device,
        model: 'Could not get device model (Unauthorized?)'
      });
    }
  }
  return ws.send(
    JSON.stringify({
      event: 'devices',
      devices
    })
  );
};
