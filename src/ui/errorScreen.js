const { QLabel } = require('@nodegui/nodegui');

function showError (error, layout) {
  const errorLabel = new QLabel();
  errorLabel.setText('Error');
  errorLabel.setStyleSheet('color: red; font-size: 50px;');
  errorLabel.setObjectName('h');
  const errorLogLabel = new QLabel();
  errorLogLabel.setText(error?.stack || error);
  errorLogLabel.setStyleSheet('font-size: 12px;');
  errorLabel.setObjectName('h');
  const issueLabel = new QLabel();
  issueLabel.setTextFormat(1);
  issueLabel.setObjectName('h');
  issueLabel.setOpenExternalLinks(true);
  issueLabel.setText(
    '<a href="https://github.com/reisxd/revanced-builder/issues">Please make an issue.</a>'
  );
  /* const copyToClipBButton = new QPushButton();
  copyToClipBButton.setText('Copy to clipboard');
  copyToClipBButton.setStyleSheet('border-radius: 12px; background-color: #333333; color: #ffffff'); */
  layout.addWidget(errorLabel);
  layout.addWidget(errorLogLabel);
  if (error.stack) {
    layout.addWidget(issueLabel);
    // layout.addWidget(copyToClipBButton);
  }
}

module.exports = showError;
