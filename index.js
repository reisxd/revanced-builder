const { createServer } = require('node:http');
const { join } = require('node:path');

const exec = require('./utils/promisifiedExec.js');

const Express = require('express');
const { WebSocketServer } = require('ws');
const open_ = require('open');
const pf = require('portfinder');

// Lazy-loaded.
/** @type {import('fkill').default} */
let fkill;

const {
  updateFiles,
  selectApp,
  getPatches,
  selectPatches,
  getAppVersion,
  checkFileAlreadyExists,
  selectAppVersion,
  patchApp,
  checkForUpdates,
  getDevices,
  setDevice,
  installReVanced
} = require('./wsEvents/index.js');

const app = Express();
const server = createServer(app);
const wsServer = new WebSocketServer({ server });
const wsClients = [];

app.use(Express.static(join(__dirname, 'public')));
app.get('/revanced.apk', (_, res) => {
  const file = join(__dirname, 'revanced', global.outputName);

  res.download(file);
});

/**
 * @param {number} port
 */
const open = async (port) => {
  if (process.platform === 'android')
    await exec(`termux-open-url http://localhost:${port}`);
  else await open_(`http://localhost:${port}`);
};

/**
 * @param {string} msg
 */
const log = (msg, newline = true, tag = true) => {
  if (newline) console.log(`${tag ? '[builder] ' : ''}${msg}`);
  else process.stdout.write(`${tag ? '[builder] ' : ''}${msg} `);
};

/**
 * @param {number} port
 */
const listen = (port) => {
  server.listen(port, async () => {
    if (process.argv.includes('--no-open'))
      log(`The webserver is now running at http://localhost:${port}`);
    else {
      log('The webserver is now running!');

      try {
        log('Opening the app in the default browser...', false);

        await open(port);

        log('Done, check if a browser window has opened', true, false);
      } catch {
        log(
          `Failed. Open up http://localhost:${port} manually in your browser.`,
          true,
          false
        );
      }
    }
  });
};

/**
 * @param {import('http').Server} svr
 */
const cleanExit = async (svr) => {
  log('Killing any dangling processes...', false);

  fkill ??= (await import('fkill')).default;

  try {
    await fkill(['adb', 'java', 'aapt2'], {
      forceAfterTimeout: 5000,
      silent: true
    });
    log('Done.', true, false);
  } catch (error) {
    log('Failed.', true, false);
    log(
      'If there are certain processes still running, you can kill them manually'
    );
    log(error?.stack, true, false);
  }

  log('Stopping the server...', false);

  svr.close(() => log('Done', true, false));
  setTimeout(() => process.exit(0), 2_500);
};

pf.getPortPromise()
  .then((freePort) => {
    log(`Listening at port ${freePort}`);
    listen(freePort);
  })
  .catch((err) => {
    log(`Unable to determine free ports.\nReason: ${err}`);
    log('Falling back to 8080.');
    listen(8080);
  });

process.on('uncaughtException', (reason) => {
  log(`An error occured.\n${reason.stack}`);
  log(
    'Please report this bug here: https://github.com/reisxd/revanced-builder/issues.'
  );
});

process.on('unhandledRejection', (reason) => {
  log(`An error occured.\n${reason.stack}`);
  log(
    'Please report this bug here: https://github.com/reisxd/revanced-builder/issues.'
  );

  for (const wsClient of wsClients) {
    wsClient.send(
      JSON.stringify({
        event: 'error',
        error: encodeURIComponent(
          `An error occured:\n${reason.stack}\nPlease report this bug here: https://github.com/reisxd/revanced-builder/issues.`
        )
      })
    );
  }
});

process.on('SIGTERM', () => cleanExit(server));

// The websocket server
wsServer.on('connection', (ws) => {
  wsClients.push(ws);
  ws.on('message', async (msg) => {
    /** @type {Record<string, any>} */
    const message = JSON.parse(msg);

    // Theres no file handler, soo...

    switch (message.event) {
      case 'checkForUpdates':
        await checkForUpdates(ws);
        break;
      case 'updateFiles':
        await updateFiles(ws);
        break;
      case 'getDevices':
        await getDevices(ws);
        break;
      case 'setDevice':
        setDevice(message);
        break;
      case 'selectApp':
        selectApp(message);
        break;
      case 'getPatches':
        await getPatches(ws);
        break;
      case 'selectPatches':
        selectPatches(message);
        break;
      case 'checkFileAlreadyExists':
        checkFileAlreadyExists(ws);
        break;
      case 'getAppVersion':
        await getAppVersion(ws);
        break;
      case 'selectAppVersion':
        await selectAppVersion(message, ws);
        break;
      case 'patchApp':
        await patchApp(ws);
        break;
      case 'installReVanced':
        await installReVanced(ws);
        break;
      case 'exit':
        process.kill(process.pid, 'SIGTERM');
    }
  });
});
