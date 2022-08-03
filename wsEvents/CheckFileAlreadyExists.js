import fs from 'fs';

export default async function (message, ws) {
  if (fs.existsSync(`./revanced/${global.jarNames.selectedApp}.apk`)) {
    ws.send(
      JSON.stringify({
        event: 'fileExists',
        isRooted: global.jarNames.isRooted
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        event: 'fileDoesntExists',
        isRooted: global.jarNames.isRooted
      })
    );
  }
}
