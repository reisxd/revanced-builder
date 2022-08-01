import Express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import {
  UpdateFiles,
  SelectApp,
  GetPatches,
  SelectPatches,
  GetAppVersion,
  SelectAppVersion,
  PatchApp
} from './wsEvents/index.js';

const app = Express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

app.use(Express.static('public'));

server.listen(80, () => {
  console.log(
    'The webserver is now running!\nOpen up http://localhost in your browser.'
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
