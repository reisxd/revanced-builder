const { QMainWindow, QWidget, FlexLayout } = require('@nodegui/nodegui');
const { preflight, excludePatches } = require('./utils/builder.js');
const { errorScreen } = require('./ui/index.js');

const win = new QMainWindow();
win.setWindowTitle('ReVanced Builder');
win.setFixedHeight(350);
win.setFixedWidth(500);

const centralWidget = new QWidget();
centralWidget.setObjectName('root');
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

process.on('unhandledRejection', async (reason) => {
  errorScreen(reason, rootLayout);
});

(async () => {
  await preflight(false, rootLayout);
  await excludePatches(rootLayout);
})();
win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
    #root {
      align-items: 'center';
      justify-content: 'center';
    }
    #h {
      font-size: 20px;
      font-weight: light;
      padding: 1;
      font: 20px "Calibri";
    }
    #progressBar {
      margin-right: 50
    }
  `
);

// Dark Mode:

win.show();
setTimeout(() => {}, 5000);
global.win = win;
global.layout = rootLayout;
