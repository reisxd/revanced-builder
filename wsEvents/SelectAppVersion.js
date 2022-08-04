import downloadApp from '../utils/downloadApp.js';

export default async function (message, ws) {
  await downloadApp(message.versionChoosen, ws);
}
