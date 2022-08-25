module.exports = async function (message, ws) {
  global.jarNames.deviceID = message.deviceId;
};
