function deleteWidgets (widgetsArray) {
  for (const widget of widgetsArray) {
    widget.setParent(null);
  }
  widgetsArray = [];
}

module.exports = {
  deleteWidgets
};
