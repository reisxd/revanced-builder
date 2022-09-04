/**
 * @param {Record<string, any>} message
 */
module.exports = function setDevice(message) {
  global.jarNames.devices = message.devices;
};
