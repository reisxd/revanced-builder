const { EOL } = require('node:os');

const exec = require('../utils/promisifiedExec.js');

const getDeviceID = require('../utils/getDeviceID.js');

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function getDevices(ws) {
  const deviceIds = await getDeviceID();
  /** @type {{ id: string; model: string }[]} */
  const devices = [];

  for (const device of deviceIds) {
    const deviceModel = await exec(
      `adb -s ${device} shell getprop ro.product.model`
    ).catch(() => null);

    devices.push({
      id: device,
      model:
        deviceModel !== null
          ? deviceModel.stdout.replace(EOL, '')
          : 'Could not get device model (Unauthorized?)'
    });
  }

  ws.send(
    JSON.stringify({
      event: 'devices',
      devices
    })
  );
};
