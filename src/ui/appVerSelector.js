const {
  QListWidget,
  QListWidgetItem,
  QPushButton
} = require('@nodegui/nodegui');
const { deleteWidgets } = require('../utils/index.js');

function appVerSelector (versionsList, ui, version, widgetsArray, app) {
  ui.labels.main.setText('Select the app version you want to download:');
  const listWidget = new QListWidget();
  listWidget.setFixedSize(735, 300);
  const continueButton = new QPushButton();
  continueButton.setText('Continue');
  continueButton.setStyleSheet('margin-bottom: 15px;');
  continueButton.addEventListener('clicked', async () => {
    const { downloadAPK } = require('../utils/builder.js');
    version = listWidget.selectedItems()[0].text();
    deleteWidgets([listWidget, continueButton]);
    await downloadAPK(version, app);
  });
  for (const version of versionsList) {
    const versionName = new QListWidgetItem();
    versionName.setText(version);
    listWidget.addItem(versionName);
  }
  ui.panels.innerPanel.addWidget(listWidget);
  ui.buttonPanel.addWidget(continueButton);
  widgetsArray = [listWidget, continueButton];
}

module.exports = appVerSelector;
