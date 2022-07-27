const { QPushButton, QListWidget } = require('@nodegui/nodegui');

async function selectApp (ui) {
  ui.labels.main.setText('Select the app you want to patch:');
  const appList = new QListWidget();
  appList.addItems(['YouTube', 'YouTube Music', 'Twitter', 'Reddit']);
  const continueButton = new QPushButton();
  continueButton.setStyleSheet('margin-bottom: 23px;');
  continueButton.setText('Continue');
  ui.buttonPanel.addWidget(continueButton);
  continueButton.addEventListener('clicked', async () => {
    const selectedApp = appList.selectedItems()[0].text();
    const { excludePatches } = require('../utils/builder.js');
    const { deleteWidgets } = require('../utils/index.js');
    deleteWidgets([appList, continueButton]);
    switch (selectedApp) {
      case 'YouTube Music': {
        excludePatches(ui, 'music');
        break;
      }

      case 'YouTube': {
        excludePatches(ui, 'youtube');
        break;
      }

      case 'Twitter': {
        excludePatches(ui, 'android');
        break;
      }

      case 'Reddit': {
        excludePatches(ui, 'frontpage');
        break;
      }
    }
  });
  ui.panels.innerPanel.addWidget(appList);
}

module.exports = selectApp;
