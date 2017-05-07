exports.baseController = 'baseviewcontroller';

$.backiconButton.title = fa.angleLeft;
if ($.args.title) {
  $.headerLabel.text = $.args.title;
}

function handleBackClick(e) {
  $.win.close();
};

function handleClose(e) {
  $.platform.hideKeyboard($.mainview);
  $.mainview.removeEventListener('close', handleClose);
  //$.destroy();
};

$.mainview.addEventListener('close', handleClose);
exports.handleClose = handleClose;

