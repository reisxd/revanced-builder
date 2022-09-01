/**
 * @param {Record<string, any>} message
 */
module.exports = function setDevice(message) {
  global.jarNames.deviceID = message.deviceId;
};
