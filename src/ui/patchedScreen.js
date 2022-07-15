const { QLabel, QTextEdit } = require('@nodegui/nodegui');
const { deleteWidgets } = require('../utils');

function patchedScreen (layout, log, adbExists, widgetsArray) {
  deleteWidgets(widgetsArray);
  const builtLabel = new QLabel();
  builtLabel.setText('ReVanced has been built.');
  builtLabel.setStyleSheet('font-size: 35px;');
  builtLabel.setObjectName('h');
  const logText = new QTextEdit();
  logText.setFixedSize(735, 250);
  logText.setStyleSheet('margin-right: 240; margin-bottom: 50;');
  logText.setText(log);
  logText.setReadOnly(true);
  const installManualLabel = new QLabel();
  installManualLabel.setObjectName('h');
  installManualLabel.setText(
    'You now can install ReVanced and MicroG by transferring revanced/revanced.apk and revanced/microg.apk!'
  );
  layout.addWidget(builtLabel);
  layout.addWidget(logText);
  if (!adbExists) {
    layout.addWidget(installManualLabel);
  }
}

module.exports = patchedScreen;
