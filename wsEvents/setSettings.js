const { writeSources } = require('../utils/Settings.js');
/**
 * @param {Record<string, any>} message
 */

module.exports = function setSettings(message) {
  writeSources(message.settings);
};
