const { QTextEdit } = require('@nodegui/nodegui');
const { exec } = require('child_process');
const util = require('util');
const actualExec = util.promisify(exec);

function patchingScreen (ui, widgetsArray, buildProcess) {
  ui.labels.main.setText('Building ReVanced...');
  const logText = new QTextEdit();
  logText.setFixedSize(735, 250);
  logText.setReadOnly(true);
  widgetsArray = [logText];
  buildProcess.stdout.on('data', async (data) => {
    logText.setText(logText.toPlainText() + data.toString());
    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      await actualExec('adb uninstall app.revanced.android.youtube');
      await actualExec('adb install revanced/revanced.apk');
    }
  });
  buildProcess.stderr.on('data', async (data) => {
    logText.setText(logText.toPlainText() + data.toString());
    if (data.toString().includes('Finished')) {
      ui.labels.main.setText('ReVanced has been built.');
    }
    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      ui.labels.main.setText('ReVanced has been built.');
      await actualExec('adb uninstall app.revanced.android.youtube');
      await actualExec('adb install revanced/revanced.apk');
    }
  });

  ui.panels.innerPanel.addWidget(logText);
}

module.exports = patchingScreen;
