const exec = require('./promisifiedExec.js');

const getDeviceID = require('../utils/getDeviceID.js');

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function checkJDKAndADB(ws) {
  try {
    const javaCheck = await exec('java -version');
    const javaVerLog = javaCheck.stderr || javaCheck.stdout;
    const javaVer = javaVerLog.match(/version\s([^:]+)/)[1].match(/"(.*)"/)[1];

    if (javaVer.split('.')[0] < 17) {
      ws.send(
        JSON.stringify({
          event: 'error',
          error:
            'You have an outdated version of JDK.<br>Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
        })
      );

      return;
    }

    if (!javaVerLog.includes('openjdk')) {
      ws.send(
        JSON.stringify({
          event: 'error',
          error:
            'You have Java, but not OpenJDK. You need to install it because of signing problems.<br>Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk'
        })
      );

      return;
    }

    const deviceIds = await getDeviceID();

    if (deviceIds !== null) {
      if (deviceIds[1]) {
        ws.send(
          JSON.stringify({
            event: 'multipleDevices'
          })
        );

        return;
      } else if (deviceIds[0]) global.jarNames.devices = deviceIds;
    } else global.jarNames.devices = [];
  } catch (err) {
    if (err.stderr.includes('java'))
      ws.send(
        JSON.stringify({
          event: 'error',
          error:
            "You don't have JDK installed.<br>Please get it from here: https://www.azul.com/downloads/?version=java-17-lts&package=jdk"
        })
      );
  }
};
