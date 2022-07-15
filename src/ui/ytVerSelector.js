const {
  QLabel,
  QListWidget,
  QListWidgetItem,
  QPushButton
} = require('@nodegui/nodegui');
const { deleteWidgets } = require('../utils/index.js');

function ytVerSelector (versionsList, layout, version, widgetsArray) {
  const selectYTVerLabel = new QLabel();
  selectYTVerLabel.setText('Select the YouTube version you want to download:');
  selectYTVerLabel.setObjectName('h');
  const listWidget = new QListWidget();
  listWidget.setFixedSize(735, 300);
  listWidget.setStyleSheet('margin-right: 240; margin-bottom: 50;');
  const continueButton = new QPushButton();
  continueButton.setText('Continue');
  continueButton.addEventListener('clicked', async () => {
    const { downloadYTApk } = require('../utils/builder.js');
    version = listWidget.selectedItems()[0].text();
    deleteWidgets([selectYTVerLabel, listWidget, continueButton]);
    await downloadYTApk(version);
  });
  for (const version of versionsList) {
    const versionName = new QListWidgetItem();
    versionName.setText(version);
    listWidget.addItem(versionName);
  }
  layout.addWidget(selectYTVerLabel);
  layout.addWidget(listWidget);
  layout.addWidget(continueButton);
  widgetsArray = [selectYTVerLabel, listWidget, continueButton];
}

module.exports = ytVerSelector;
