function deleteWidgets (widgetsArray, layout) {
  for (const widget of widgetsArray) {
    widget.setParent(null);
  }
  widgetsArray = [];
}

module.exports = {
  deleteWidgets
};
