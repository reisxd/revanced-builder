const { QWidget, FlexLayout, QLabel } = require('@nodegui/nodegui');

function initializeUI (layout) {
  const panelOne = new QWidget();
  const panelLayout = new FlexLayout();
  panelOne.setLayout(panelLayout);
  panelOne.setObjectName('panel1');
  const panelTwo = new QWidget();
  panelTwo.setObjectName('panel2');
  const panelTwoLayout = new FlexLayout();
  const buttons = new QWidget();
  buttons.setObjectName('buttons');
  const buttonsPanel = new FlexLayout();
  buttons.setLayout(buttonsPanel);
  const mainLabel = new QLabel();
  mainLabel.setStyleSheet(
    'font-size: 20px; font-weight: light; padding: 1; font: 20px "Calibri"; color: white;'
  );
  const lowerLabel = new QLabel();
  panelTwo.setLayout(panelTwoLayout);
  layout.addWidget(mainLabel);
  layout.addWidget(lowerLabel);
  panelLayout.addWidget(panelTwo);
  panelLayout.addWidget(buttons);
  layout.addWidget(panelOne);
  return {
    layout,
    panels: {
      main: panelLayout,
      innerPanel: panelTwoLayout
    },
    buttonPanel: buttonsPanel,
    labels: {
      main: mainLabel,
      lower: lowerLabel
    }
  };
}

/*
    const continueButton = new QPushButton();
    continueButton.setFixedSize(51, 51);
    continueButton.setText('Continue');
    buttonsPanel.addWidget(continueButton);
*/

module.exports = initializeUI;
