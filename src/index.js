const {
  QMainWindow,
  QWidget,
  FlexLayout,
  WindowType
} = require('@nodegui/nodegui');
const { preflight, excludePatches } = require('./utils/builder.js');
const { errorScreen, initializeUI } = require('./ui/index.js');

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
win.setStyleSheet(
  `
  #background
  {
    width: ${win.width()}px;
    height: ${win.height()};
    padding: 15px;
    padding-right: 0;
    background-color: #1e1e1e;
  }
  
  #panel1
  {
    display: flex;
    flex-direction: column;
    width: ${win.width() - 35};
    height: ${win.height() - 70};
    border-radius: 5px;
    background-color: #232323;
  }
  
  #panel2
  {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: ${win.width() - 35};
    height: ${win.height() - 100};
    border-radius: 5px;
    background-color: #303030;
  }
  
  #viewPanel
  {
    width: 200px;
    height: 100px;
    margin: 8px;
    margin-left: auto;
    border-radius: 5px;
    background-color: #3b3b3b;
  }
  
  #button1{
    margin: 5px;
    width: 50px;
    height: 15px;
    border-radius: 25px;
    background-color: #3b3b3b;
  }
  
  QPushButton
  {
    border-radius: 20px;
    background-color: #bf7171;
    margin-bottom: 35px;
    color: #ffffff;
  }
  
  #buttons
  {
    display: flex;
    flex-direction: row;
    padding: 5px;
  }
  
  #headers
  {
    display: flex;
    flex-direction: row;
    width: ${win.width() - 35};
  }
  
  #header1
  {
    background-color: #3e3e3e;
    height: 25px;
    width: ${(win.width() - 35 / 100) * 75};
  }
  
  #header2
  {
    background-color: #282828;
    height: 25px;
  }
  
  #text
  {
    font-size: 10px;
    font-weight: light;
    padding: 1;
    font: 10px "Calibri";
  }

  QListWidget
  {
    background-color: #303030; 
    color: white;
  }

  QTextEdit
  {
    color: white; 
    background-color: #303030;
    border: 0px;
  }
  `
);

win.show();
global.win = win;
global.layout = rootLayout;
