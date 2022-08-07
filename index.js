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
const open = require('open');

const app = Express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

app.use(morgan('dev'));
app.use(Express.static(path.join(__dirname, 'public')));
app.use(
  '/revanced.apk',
  Express.static(path.join(__dirname, 'revanced/revanced.apk'))
);

server.listen(8080, () => {
  console.log('The webserver is now running!');
  try {
    // Shrihan, I sometimes question what are you doing with the console
    // :moyai:
    console.log('Opening the app in the default browser...');
    open('http://localhost:8080');
    console.log('Done. Check if a browser window has opened');
  } catch (e) {
    console.log('Failed. Open up http://localhost:8080 in your browser.');
  }
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
    }
  });
});
