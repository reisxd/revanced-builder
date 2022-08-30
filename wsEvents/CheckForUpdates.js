const { getDownloadLink } = require('../utils/FileDownloader.js');

module.exports = async function (message, ws) {
  const builderVersion = (
    await getDownloadLink({ owner: 'reisxd', repo: 'revanced-builder' })
  ).version;
  // Well, there's no other good way to do this, so...
  const currentVersion = 'v3.3.7';

  if (builderVersion !== currentVersion) {
    return ws.send(
      JSON.stringify({
        event: 'notUpToDate',
        builderVersion
      })
    );
  }
};
