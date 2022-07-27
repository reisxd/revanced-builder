const {
  QListWidget,
  QListWidgetItem,
  QPushButton
} = require('@nodegui/nodegui');
const fs = require('fs');
const { deleteWidgets } = require('../utils/index.js');

function patchesScreen (selectedPatches, ui, variables, widgetsArray, pkg) {
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
  let excludedPatchList = [];
  let patchesList = fs.readFileSync('./excludedPatchesList.json').toString();
  patchesList = JSON.parse(patchesList);
  excludedPatchList = patchesList;
  continueButton.addEventListener('clicked', async () => {
    const { errorScreen, useOldApkScreen } = require('./index.js');
    const { getAppVersions, getAppVersion } = require('../utils/builder.js');
    let appVersion;
    const packageObject = {
      pkg,
      excludedPatches: []
    };

    for (const listItem of listWidget.selectedItems()) {
      const patch = listItem.text();
      if (patch.includes('microg-support')) {
        if (!variables.adbExists) {
          deleteWidgets(widgetsArray);
          return errorScreen(
            'You don\'t have ADB installed.\nPlease install it it from the <a href="Offical android website">https://developer.android.com/studio/releases/platform-tools</a> Or the 15 second installer at the <a href="https://forum.xda-developers.com/t/official-tool-windows-adb-fastboot-and-drivers-15-seconds-adb-installer-v1-4-3.2588979">XDA Forums</a>',
            ui
          );
        }
        if (variables.foundDevice) {
          switch (pkg) {
            case 'youtube': {
              appVersion = await getAppVersion('com.google.android.youtube');
              break;
            }

            case 'music': {
              appVersion = await getAppVersion(
                'com.google.android.apps.youtube.music'
              );
              break;
            }

            case 'android': {
              appVersion = await getAppVersion('com.twitter.android');
              break;
            }

            case 'frontpage': {
              appVersion = await getAppVersion('com.reddit.frontpage');
              break;
            }
          }
          variables.patches += ' --mount';
          variables.isRooted = true;
        } else {
          deleteWidgets(widgetsArray);
          return errorScreen(
            "Could not find the device, Please try the following:\n * Install / Load the USB drivers for the device\n * Enable developer mode on the device\n * Enable USB debugging on the device's developer tools\n * Try rebooting your device, or try rebooting your computer\n",
            ui
          );
        }
      }
      const patchName = patch.replace(/\|.+(.*)$/, '');
      variables.patches += ` -e ${patchName}`;
      packageObject.excludedPatches.push(patchName);
    }
    let foundObj = false;
    for (const packageObj of excludedPatchList) {
      if (typeof packageObj === 'string') continue;
      if (packageObj.pkg === pkg) {
        packageObj.excludedPatches = packageObject.excludedPatches;
        foundObj = true;
      }
    }

    if (!foundObj) {
      excludedPatchList.push(packageObject);
    }

    fs.writeFileSync(
      './excludedPatchesList.json',
      JSON.stringify(excludedPatchList)
    );

    deleteWidgets([listWidget, continueButton]);
    if (appVersion === null) return;
    if (variables.isRooted) {
      getAppVersions(appVersion, pkg);
    } else if (fs.existsSync(`./revanced/${pkg}.apk`)) {
      useOldApkScreen(ui, pkg);
    } else {
      getAppVersions(null, pkg);
    }
  });
  for (const patch of selectedPatches) {
    let excludedPatches = [];
    const patchName = patch.replace(/\|.+(.*)$/, '');
    if (fs.existsSync('./excludedPatchesList.json')) {
      excludedPatches = fs.readFileSync('./excludedPatchesList.json');
      excludedPatches = JSON.parse(excludedPatches);
    }
    const patchItem = new QListWidgetItem();
    patchItem.setText(patch);
    listWidget.addItem(patchItem);
    for (const pack of excludedPatches) {
      if (pack.pkg === pkg) {
        if (pack.excludedPatches.includes(patchName)) {
          patchItem.setSelected(true);
          listWidget.setCurrentItem(patchItem);
        }
      }
    }
  }
  ui.panels.innerPanel.addWidget(listWidget);
  ui.buttonPanel.addWidget(continueButton);
}

module.exports = patchesScreen;
