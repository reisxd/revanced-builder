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
  PatchApp
} = require('./wsEvents/index.js');
const morgan = require('morgan');

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
  if (require('os').platform === 'android') {
    await require('util').promisify(
      require('child_process').exec(`termux-open-url http://localhost:${PORT}`)
    );
  } else require('open')(`http://localhost:${PORT}`);
};

const listen = (PORT) => {
  server.listen(PORT, () => {
    console.log('The webserver is now running!');
    try {
      console.log('Opening the app in the default browser...');
      open(PORT);
      console.log('Done. Check if a browser window has opened');
    } catch (e) {
      console.log(
        `Failed. Open up http://localhost:${PORT} manually in your browser.`
      );
    }
  });
};

require('portfinder')
  .getPortPromise()
  .then((port) => {
    console.log(`[builder] Using port ${port}`);
    listen(port);
  })
  .catch((err) => {
    console.error(`[builder] Unable to determine free ports. Reason:\n${err}`);
    listen(8080);
  });

process.on('uncaughtException', (reason) => {
  console.log(
    `An error occured.\n${reason.stack}\nPlease report this bug here: https://github.com/reisxd/revanced-builder/issues`
  );
});

process.on('unhandledRejection', (reason) => {
  console.log(
    `An error occured.\n${reason.stack}\nPlease report this bug here: https://github.com/reisxd/revanced-builder/issues`
  );
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('The webserver was stopped.');
    setTimeout(() => process.exit(0), 2000);
  });
});

// The websocket server
wsServer.on('connection', (ws) => {
  ws.on('message', async (msg) => {
    const message = JSON.parse(msg);

    // Theres no file handler, soo...

    switch (message.event) {
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
