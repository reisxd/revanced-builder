const {
  QMainWindow,
  QWidget,
  FlexLayout,
  WindowType
} = require('@nodegui/nodegui');
const { preflight, excludePatches } = require('./utils/builder.js');
const { errorScreen, initializeUI } = require('./ui/index.js');
const { readFileSync } = require('fs');
const { join: joinPath } = require('path');

const win = new QMainWindow();
win.setWindowTitle('ReVanced Builder');
win.setFixedHeight(400);
win.setFixedWidth(700);

const centralWidget = new QWidget();
centralWidget.setWindowFlag(WindowType.CustomizeWindowHint, true);
centralWidget.setObjectName('background');
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

const ui = initializeUI(rootLayout);

process.on('unhandledRejection', async (reason) => {
  errorScreen(reason, ui);
});

(async () => {
  await preflight(false, ui);
  await excludePatches(ui);
})();
win.setCentralWidget(centralWidget);
win.setStyleSheet(readFileSync(joinPath(__dirname, 'main.qss')).toString());

win.show();
global.win = win;
global.layout = rootLayout;
