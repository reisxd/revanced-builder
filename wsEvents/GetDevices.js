const getDeviceID = require('../utils/getDeviceID.js');

module.exports = async function (message, ws) {
    const deviceIds = await getDeviceID();
    
    return ws.send(JSON.stringify({
        event: 'devices',
        deviceIds
    }));
};
  