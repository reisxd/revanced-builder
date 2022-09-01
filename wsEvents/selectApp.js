/**
 * @param {Record<string, any>} message
 */
module.exports = function selectApp(message) {
  global.jarNames.selectedApp = message.selectedApp;
};
