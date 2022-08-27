const { promisify } = require('util');
const { exec } = require('child_process');
const getDeviceID = require('../utils/getDeviceID.js');
const actualExec = promisify(exec);

module.exports = async function (ws) {
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
            'You have an outdated version of JDK.<br>Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk"'
        })
      );
    }

    if (!javaVerLog.includes('openjdk')) {
      return ws.send(
        JSON.stringify({
          event: 'error',
          error:
            'You have Java, but not OpenJDK. You need to install it because of signing problems.<br>Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
        })
      );
    }
    const deviceIds = await getDeviceID();

    if (deviceIds && deviceIds[1]) {
      return ws.send(
        JSON.stringify({
          event: 'multipleDevices'
        })
      );
    } else if (deviceIds && deviceIds[0]) {
      global.jarNames.deviceID = deviceIds[0];
    } else global.jarNames.deviceID = null;
  } catch (e) {
    if (e.stderr.includes('java')) {
      return ws.send(
        JSON.stringify({
          event: 'error',
          error:
            'You don\'t have JDK installed.<br>Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk"'
        })
      );
    }
  }
};
