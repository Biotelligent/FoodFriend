exports.baseController = 'baseviewcontroller';

Alloy.Globals.activecontroller = null;
Alloy.Globals.activeview= null;

$.lib.config.load();
var token = Ti.App.Properties.getString('fstoken', '');
//if (token === '') {
//  token = 'DVIYVHGUHPUR3YTVW5PIAREORYQB1R05JY5CAZ0P14510BT4';
//  Ti.App.Properties.setString('accesstoken', token);
//}

if (OS_ANDROID) {
  // navBarHidden no longer works, refer http://docs.appcelerator.com/titanium/3.0/#!/guide/Android_Action_Bar
  $.index.addEventListener('open', function(e) {
    e.source.activity.actionBar.hide();
  });
  $.index.open();
}

if (OS_IOS) {
  Alloy.Globals.drawer = $.drawer;
  Alloy.Globals.centerWindow = $.centerWindow;
  // if ($.lib.platform.isTablet) {
    // $.drawer.orientationModes = $.lib.platform.orientations;
    // $.drawer.open({orientationModes: $.lib.platform.orientations});
    // $.lib.logInfo('$.index.opened, Ti.Gesture.isLandscape()=' + Ti.Gesture.isLandscape());
  // } else {
    $.drawer.open();
  // }
  
  if (token === '') {
    $.showController('Preferences');
  } else {
    $.showController('SearchMap');
  }
}
