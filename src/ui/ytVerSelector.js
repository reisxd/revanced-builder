const {
  QListWidget,
  QListWidgetItem,
  QPushButton
} = require('@nodegui/nodegui');
const { deleteWidgets } = require('../utils/index.js');

function ytVerSelector (versionsList, ui, version, widgetsArray) {
  ui.labels.main.setText('Select the YouTube version you want to download:');
  const listWidget = new QListWidget();
  listWidget.setFixedSize(735, 300);
  const continueButton = new QPushButton();
  continueButton.setText('Continue');
  continueButton.addEventListener('clicked', async () => {
    const { downloadYTApk } = require('../utils/builder.js');
    version = listWidget.selectedItems()[0].text();
    deleteWidgets([listWidget, continueButton]);
    await downloadYTApk(version);
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

module.exports = ytVerSelector;
