const { QLabel, QPushButton } = require('@nodegui/nodegui');
const { deleteWidgets } = require('../utils/index.js');

function useOldApkScreen (ui) {
  ui.labels.main.setText('Use already downloaded APK?');
  const label = new QLabel();
  label.setStyleSheet(
    'font-size: 20px; font-family: "Segoe UI", serif; font-weight: 500; color: white; margin: 0;'
  );
  label.setText(
    'The YouTube APK already exists in the revanced folder.\nDo you want to use it?'
  );
  const useAPK = new QPushButton();
  useAPK.setStyleSheet('margin-bottom: 15px;');
  useAPK.setText('Use downloaded APK');
  const downloadAPK = new QPushButton();
  downloadAPK.setStyleSheet('margin-bottom: 15px; margin-left: 10px;');
  ui.space.setStyleSheet('margin-left: 150px;');
  downloadAPK.setText('Use another APK');
  useAPK.addEventListener('clicked', async () => {
    const { buildReVanced } = require('../utils/builder.js');
    deleteWidgets([label, useAPK, downloadAPK]);
    await buildReVanced();
  });
  downloadAPK.addEventListener('clicked', () => {
    const { getYTVersions } = require('../utils/builder.js');
    deleteWidgets([label, useAPK, downloadAPK]);
    ui.space.setStyleSheet('margin-left: 275px;');
    getYTVersions();
  });
  ui.buttonPanel.addWidget(useAPK);
  ui.buttonPanel.addWidget(downloadAPK);
  ui.panels.innerPanel.addWidget(label);
}

module.exports = useOldApkScreen;
