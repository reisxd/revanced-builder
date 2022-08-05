const downloadApp = require('../utils/downloadApp.js');

module.exports = async function (message, ws) {
  await downloadApp(message.versionChoosen, ws);
};
