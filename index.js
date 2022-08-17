const Express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const {
  UpdateFiles,
  SelectApp,
  GetPatches,
  SelectPatches,
  GetAppVersion,
  CheckFileAlreadyExists,
  SelectAppVersion,
  PatchApp,
  CheckForUpdates
} = require('./wsEvents/index.js');
const morgan = require('morgan');
const { platform } = require('os');
const exec = (cmd) =>
  require('util').promisify(require('child_process').exec(cmd));
const opn = require('open');
const pf = require('portfinder');

const app = Express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

app.use(morgan('dev'));
app.use(Express.static(path.join(__dirname, 'public')));
app.get('/revanced.apk', function (req, res) {
  const file = path.join(__dirname, 'revanced', global.outputName);
  res.download(file);
});

const open = async (PORT) => {
  if (platform === 'android') {
    await exec(`termux-open-url http://localhost:${PORT}`);
  } else opn(`http://localhost:${PORT}`);
};

const log = (msg, newline = true, tag = true) =>
  newline
    ? console.log(`${tag ? '[builder] ' : ''}${msg}`)
    : process.stdout.write(`${tag ? '[builder] ' : ''}${msg} `);

const listen = (PORT) => {
  server.listen(PORT, () => {
    log('The webserver is now running!');
    try {
      log('Opening the app in the default browser...', false);
      open(PORT);
      log('Done. Check if a browser window has opened', true, false);
    } catch (e) {
      log(
        `Failed. Open up http://localhost:${PORT} manually in your browser.`,
        true,
        false
      );
    }
  });
};

const cleanExit = async (svr) => {
  log('Killing any dangling processes...', false);
  const fkill = await import('fkill');
  await fkill.default(['adb', 'java', 'aapt2'], {
    forceAfterTimeout: 5000,
    tree: true,
    ignoreCase: true,
    silent: true
  });
  log('Done.', true, false);
  log('Stopping the server...', false);
  svr.close(() => log('Done', true, false));
  setTimeout(() => process.exit(0), 2500);
};

pf.getPortPromise()
  .then((port) => {
    log(`Listening at port ${port}`);
    listen(port);
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
});

process.on('SIGTERM', () => cleanExit(server));

// The websocket server
wsServer.on('connection', (ws) => {
  ws.on('message', async (msg) => {
    const message = JSON.parse(msg);

    // Theres no file handler, soo...

    switch (message.event) {
      case 'checkForUpdates': {
        await CheckForUpdates(message, ws);
        break;
      }
      case 'updateFiles': {
        await UpdateFiles(message, ws);
        break;
      }

      case 'selectApp': {
        await SelectApp(message, ws);
        break;
      }

      case 'getPatches': {
        await GetPatches(message, ws);
        break;
      }

      case 'selectPatches': {
        await SelectPatches(message, ws);
        break;
      }

      case 'checkFileAlreadyExists': {
        await CheckFileAlreadyExists(message, ws);
        break;
      }

      case 'getAppVersion': {
        await GetAppVersion(message, ws);
        break;
      }

      case 'selectAppVersion': {
        await SelectAppVersion(message, ws);
        break;
      }

      case 'patchApp': {
        await PatchApp(message, ws);
        break;
      }

      case 'exit': {
        process.kill(process.pid, 'SIGTERM');
        break;
      }
    }
  });
});
