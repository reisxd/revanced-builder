import { promisify } from 'util';
import { exec } from 'child_process';
const actualExec = promisify(exec);

export default async function (message, ws) {
  const buildProcess = await actualExec(
    `java -jar ${global.jarNames.cli} -b ${
      global.jarNames.patchesJar
    } --experimental -a ./revanced/youtube.apk ${
      global.jarNames.deviceId
    } -o ./revanced/revanced.apk ${
      global.jarNames.selectedApp === 'youtube'
        ? '-m ' + global.jarNames.integrations
        : ''
    } ${global.jarNames.patches}`,
    { maxBuffer: 5120 * 1024 }
  );

  buildProcess.stdout.on('data', async (data) => {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: data.toString()
      })
    );
  });

  buildProcess.stderr.on('data', async (data) => {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: data.toString()
      })
    );
  });
}
