const { QLabel, QProgressBar } = require('@nodegui/nodegui');

function patchingScreen (layout, widgetsArray) {
  const label = new QLabel();
  label.setObjectName('h');
  label.setText('Building ReVanced...');
  const progressBar = new QProgressBar();
  progressBar.setObjectName('progressBar');
  progressBar.setMinimum(0);
  progressBar.setMaximum(0);
  progressBar.setValue(0);
  progressBar.setFixedSize(250, 25);
  widgetsArray = [label, progressBar];
  layout.addWidget(label);
  layout.addWidget(progressBar);
}

module.exports = patchingScreen;
