const { join } = require('node:path');
const { existsSync } = require('node:fs');

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = function checkFileAlreadyExists(ws) {
  ws.send(
    JSON.stringify({
      event: existsSync(
        join(
          global.revancedDir,
          `${global.jarNames.selectedApp.packageName}.apk`
        )
      )
        ? 'fileExists'
        : 'fileDoesntExist',
      isRooted: global.jarNames.isRooted
    })
  );
};
