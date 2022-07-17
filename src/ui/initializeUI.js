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
    'font-size: 20px; font-family: "Segoe UI", serif; font-weight: 500; color: white; margin: 0;'
  );
  const space = new QLabel();
  space.setObjectName('space');
  const lowerLabel = new QLabel();
  panelTwo.setLayout(panelTwoLayout);
  panelLayout.addWidget(mainLabel);
  // panelLayout.addWidget(lowerLabel);
  panelLayout.addWidget(panelTwo);
  layout.addWidget(panelOne);
  buttonsPanel.addWidget(space);
  panelLayout.addWidget(buttons);
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
    },
    space
  };
}

/*
    const continueButton = new QPushButton();
    continueButton.setFixedSize(51, 51);
    continueButton.setText('Continue');
    buttonsPanel.addWidget(continueButton);
*/

module.exports = initializeUI;
