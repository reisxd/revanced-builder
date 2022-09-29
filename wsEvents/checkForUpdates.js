const { getDownloadLink } = require('../utils/FileDownloader.js');

const currentVersion = 'v3.4.12';

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function checkForUpdates(ws) {
  const builderVersion = (
    await getDownloadLink({ owner: 'reisxd', repo: 'revanced-builder' })
  ).version;

  if (builderVersion !== currentVersion)
    ws.send(
      JSON.stringify({
        event: 'notUpToDate',
        builderVersion
      })
    );
};

module.exports.currentVersion = currentVersion;
