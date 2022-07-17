const {
  QListWidget,
  QListWidgetItem,
  QPushButton
} = require('@nodegui/nodegui');
const fs = require('fs');
const { deleteWidgets } = require('../utils/index.js');

function patchesScreen (selectedPatches, ui, variables, widgetsArray) {
  ui.labels.main.setText('Select the patches you want to exclude:');
  ui.labels.main.setObjectName('text');
  const listWidget = new QListWidget();
  listWidget.setSelectionMode(2);
  listWidget.setFixedSize(735, 300);
  const continueButton = new QPushButton();
  continueButton.setStyleSheet('margin-bottom: 23px;');
  continueButton.setText('Continue');
  widgetsArray = [listWidget, continueButton];
  listWidget.setObjectName('items');
  continueButton.addEventListener('clicked', async () => {
    const { errorScreen, useOldApkScreen } = require('./index.js');
    const { getYTVersions, getYTVersion } = require('../utils/builder.js');
    let ytVersion;
    for (const listItem of listWidget.selectedItems()) {
      const patch = listItem.text();
      if (patch.includes('microg-support')) {
        if (!variables.adbExists) {
          deleteWidgets(widgetsArray);
          return errorScreen(
            "You don't have ADB installed.\nPlease get it from here: https://developer.android.com/studio/releases/platform-tools\n",
            ui
          );
        }
        if (variables.foundDevice) {
          ytVersion = await getYTVersion();
          variables.patches += ' --mount';
          variables.isRooted = true;
        } else {
          deleteWidgets(widgetsArray);
          return errorScreen(
            "Couldn't find the device. Please plug in the device.",
            ui
          );
        }
      }
      const patchName = patch.replace(/\|.+(.*)$/, '');
      variables.patches += ` -e ${patchName}`;
    }
    deleteWidgets([listWidget, continueButton]);
    if (variables.isRooted) {
      getYTVersions(ytVersion);
    } else if (fs.existsSync('./revanced/youtube.apk')) {
      useOldApkScreen(ui);
    } else {
      getYTVersions();
    }
  });
  for (const patch of selectedPatches) {
    const patchItem = new QListWidgetItem();
    patchItem.setText(patch);
    listWidget.addItem(patchItem);
  }
  ui.panels.innerPanel.addWidget(listWidget);
  ui.buttonPanel.addWidget(continueButton);
}

module.exports = patchesScreen;
