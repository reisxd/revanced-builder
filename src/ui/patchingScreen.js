const { QTextEdit } = require('@nodegui/nodegui');
const { exec } = require('child_process');
const util = require('util');
const actualExec = util.promisify(exec);

function patchingScreen (ui, widgetsArray, buildProcess, vars) {
  ui.labels.main.setText('Building ReVanced...');
  const logText = new QTextEdit();
  logText.setFixedSize(675, 313);
  logText.setStyleSheet('margin-right: 26px; margin-bottom: 23px;');
  logText.setReadOnly(true);

  if (!vars.adbExists || !vars.deviceId) {
    logText.setText(
      'When building ReVanced finishes, please check the revanced folder!\n'
    );
  }
  let pkgName;

  switch (vars.downloadedAPK) {
    case 'youtube': {
      if (!vars.isRooted) {
        pkgName = 'app.revanced.android.youtube';
        break;
      } else break;
    }

    case 'music': {
      if (!vars.isRooted) {
        pkgName = 'app.revanced.android.apps.youtube.music';
        break;
      } else break;
    }

    default: {
      pkgName = vars.downloadedAPK;
    }
  }

  widgetsArray = [logText];
  buildProcess.stdout.on('data', async (data) => {
    logText.setText(logText.toPlainText() + data.toString());
    if (data.toString().includes('Finished')) {
      ui.labels.main.setText('ReVanced has been built.');
    }

    if (data.toString().includes('AndroidRuntime')) {
      ui.labels.main.setText(
        'ReVanced has (probably) been built. Please check your phone!'
      );
      setTimeout(() => buildProcess.kill(), 60000);
    }

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

    if (data.toString().includes('AndroidRuntime')) {
      ui.labels.main.setText(
        'ReVanced has (probably) been built. Please check your phone!'
      );
      setTimeout(() => buildProcess.kill(), 60000);
    }

    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      ui.labels.main.setText('ReVanced has been built.');
      await actualExec(`adb uninstall ${pkgName}`);
      await actualExec('adb install revanced/revanced.apk');
    }
  });

  ui.panels.innerPanel.addWidget(logText);
}

module.exports = patchingScreen;
