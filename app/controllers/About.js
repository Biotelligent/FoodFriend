exports.baseController = 'baseviewcontroller';

$.lib.config.load();

$.aboutView.addEventListener('click', handleShowWebsite);
$.mainview.addEventListener('close', handleClose);

$.aboutLabel.text = Ti.App.description;
$.visitLabel.text = Ti.App.url;
$.copyrightLabel.text = '\u24b8' + ' ' + Ti.App.copyright + '\n' + L('allrightsreserved', 'All rights reserved.');
$.copyrightLabel.bubbleParent = false;

function Save() {
  $.lib.logInfo('Settings: saving changes');
  $.lib.config.save();
};

function handleInputReturn(e) {
  $.platform.hideKeyboard(e.source);
  Save();
};

function handleSwitchChange(e) {
  Save();
};

function handleHeaderClick(e) {
  Save(e);
  $.showMainMenu();
};

function handleShowWebsite(e) {
  Ti.Platform.openURL(Ti.App.url);
};

function handleClose(e) {
  Save();
  $.platform.hideKeyboard($.mainview);
  $.mainview.removeEventListener('close', handleClose);
  $.aboutView.removeEventListener('click', handleShowWebsite);
  //$.destroy();
};

exports.handleClose = handleClose;

