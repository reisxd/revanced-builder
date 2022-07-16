const { QLabel, QTextEdit } = require('@nodegui/nodegui');

function showError (error, ui) {
  ui.labels.main.setText('Error');
  ui.labels.main.setStyleSheet(
    'font-size: 20px; font-weight: light; font: 20px "Calibri"; color: red;'
  );
  const errorLogBox = new QTextEdit();
  errorLogBox.setText(error?.stack || error);
  errorLogBox.setReadOnly(true);
  const issueLabel = new QLabel();
  issueLabel.setTextFormat(1);
  issueLabel.setObjectName('text');
  issueLabel.setOpenExternalLinks(true);
  issueLabel.setStyleSheet(
    'font-size: 20px; font-weight: light; font: 20px "Calibri";'
  );
  issueLabel.setText(
    '<a href="https://github.com/reisxd/revanced-builder/issues">Please make an issue.</a>'
  );
  /* const copyToClipBButton = new QPushButton();
  copyToClipBButton.setText('Copy to clipboard');
  copyToClipBButton.setStyleSheet('border-radius: 12px; background-color: #333333; color: #ffffff'); */
  ui.panels.innerPanel.addWidget(errorLogBox);
  if (error.stack) {
    ui.panels.innerPanel.addWidget(issueLabel);
    // ui.addWidget(copyToClipBButton);
  }
}

module.exports = showError;
