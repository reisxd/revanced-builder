import { promisify } from 'util';
import { exec } from 'child_process';
import getDeviceID from '../utils/getDeviceID.js';
const actualExec = promisify(exec);

export default async function (ws) {
  try {
    const javaCheck = await actualExec('java -version');
    const javaVerLog = javaCheck.stderr || javaCheck.stdout;
    const javaVer = Array.from(javaVerLog.matchAll(/version\s([^:]+)/g))
      .map((match) => match[1])[0]
      .match(/"(.*)"/)[1];
    if (javaVer.split('.')[0] < 17) {
      return ws.send(
        JSON.stringify({
          event: 'error',
          error:
            'You have an outdated version of JDK. Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk"'
        })
      );
    }

    if (!javaVerLog.includes('openjdk')) {
      return ws.send(
        JSON.stringify({
          event: 'error',
          error:
            'You have Java, but not OpenJDK. You need to install it because of signing problems. Please get it from here: https://jdk.java.net/archive/ Download the zip/tar.gz for your OS under "17.0.2 (build 17.0.2+8)"'
        })
      );
    }
    await getDeviceID();
  } catch (e) {
    if (e.stderr.includes('java')) {
      return ws.send(
        JSON.stringify({
          event: 'error',
          error:
            "You don't have JDK installed. Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk"
        })
      );
    }
  }
}
