const { getSources } = require('../utils/Settings.js');
/**
 * @param {import('ws').WebSocket} ws
 */

module.exports = function getSettings(ws) {
  const settings = getSources();

  ws.send(
    JSON.stringify({
      event: 'settings',
      settings
    })
  );
};
