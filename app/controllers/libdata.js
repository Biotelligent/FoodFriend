/*
 * Session information
 */
var isDebugMode = true;
var ignorefilters = ['cache', 'download'];

var onLogInfo = null;

function isNull(obj) {
  return (undefined === obj) || (obj === null) ? true : false;
};

function isNullOrBlank(obj) {
  return (undefined === obj) || (obj === null) || ((_.isString(obj) && (obj.trim() === '')))  ? true : false;
};
/*
 * LOGGING
 */

function logInfo(messageOrObj, filters) {
  // Allow filtering out noisy or tested log messages
  var filterarray = filters || []; 
  if (_.isString(filters)) {
    filterarray = [];
    filterarray.push(filters);
  }
  if (_.intersection(filters, ignorefilters).length > 0) {
    return;
  }
  
  var message;
  if (_.isString(messageOrObj)) {
    message = messageOrObj;     
  } else if (undefined !== messageOrObj) {
    try {
      message = JSON.stringify(messageOrObj);
      if (message.length > 1200) {
        message = message.substr(0, 1200);
      }  
    } catch(E) {
      return logError(e);
    }       
  }
  if (message) {
    Ti.API.info(message);
    if (_.isFunction(onLogInfo)) {
      onLogInfo(message);
    }
  }
};

function errorMessage(e, prefix) {
  // Consistent handling of acs errors
  try {
    var msg = (e.error && e.message) || JSON.stringify(e);
    msg = _.isString(prefix) ? '{' + prefix + '} ' + msg : '{Error} ' + msg;
    if (e.code) {
      return 'code: ' + e.code + ' ' + msg;
    } else {
      return msg;
    }
  } catch(E) {
    return 'Error: (no message detail available)';
  } 
};
function logError(e, prefix) {
  Ti.API.error(errorMessage(e, prefix));
};
function showError(e, prefix) {
  var msg = errorMessage(e, prefix);
  Ti.API.error(msg);
  alert(msg);
};
exports.assignLogInfo = function(e) {
  // Assign to a handler to display
  onLogInfo = e; 
}; 
exports.isNull = isNull;
exports.logInfo = logInfo;
exports.logError = logError;
exports.showError = showError;
exports.log = logInfo;

/*
 * PLATFORM HELPERS
 */
var platform = {
  initialised: false,
  orientation: -1,
  IOS7: false,
  workingTop: 0,
  workingWidth: 0,
  workingHeight: 0,
  tabHeight: 0,
  isSimulator: false,   
  isTablet: false,
  showTabFunction: null,
  orientations: [Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT], // when debugging tablet + landscape, limit to landscape to force the simulator layout
};

platform.init = function(rootwindow, tabHeight) {
  // Pass the root window (eg. $.index) to hook postLayout and calculate the correct working area
  tabHeight = 0;// tabHeight || platform.tabHeight;
  platform.initialised = (true === platform.initialised) && (platform.orientation === Ti.Gesture.orientation);
  if (platform.initialised && (tabHeight === platform.tabHeight)) return;
  Ti.API.info('appbasecontroller.platform.init tabHeight=', tabHeight);
  
  var IOS7 = OS_IOS && parseInt(Ti.Platform.version, 10) > 6 ? true : false;
  var workingTop = IOS7 ? 20 : 0;
  var workingWidth = Ti.Platform.displayCaps.platformWidth;
  OS_ANDROID && (workingWidth /= Ti.Platform.displayCaps.logicalDensityFactor);
  var workingHeight = Ti.Platform.displayCaps.platformHeight;
  OS_ANDROID && (workingHeight /= Ti.Platform.displayCaps.logicalDensityFactor);
  workingHeight -= workingTop;
  
  platform.IOS7 = IOS7;
  platform.workingTop = workingTop;
  platform.workingHeight = workingHeight;
  platform.workingWidth = workingWidth;
  platform.tabHeight = tabHeight ? +tabHeight : 0;
  
  var genymotionsimulator = "Galaxy Nexus - 4.1.1 - with Google Apps - API 16 - 720x1280";
  var platformModel = Ti.Platform.model;
  platform.isSimulator = ((platformModel == genymotionsimulator) || (platformModel == 'simulator') || (platformModel == 'Simulator') || (platformModel == 'sdk') || (platformModel == 'google_sdk')) ? true : false;

  platform.isTablet = (Ti.Platform.osname === 'ipad') ? true : false;
  // DEBUG assist
  if (platform.isTablet) {
    platform.orientations = [Ti.UI.LANDSCAPE_LEFT];
    platform.orientation = Ti.UI.LANDSCAPE_LEFT;
  } else {
    platform.orientation = Ti.UI.PORTRAIT; // Ti.Gesture.orientation;
  }
  platform.initialised = true;
};
platform.init(undefined, 0);

platform.showTab = function(tabnumber) {
  if (_.isFunction(platform.showTabFunction)) {
    platform.showTabFunction(tabnumber);
  }
};

platform.isLandscape = function() {
  // Helper to return true for landscape if we forced it in debug mode
  var _islandscape = (Ti.Gesture.isLandscape() || (platform.orientation == Ti.UI.LANDSCAPE_LEFT) || (platform.orientation == Ti.UI.LANDSCAPE_RIGHT)) ? true : false;
  logInfo('platform.isLandScape=' + _islandscape
    + ' Ti.Gesture.isLandScape=' + Ti.Gesture.isLandscape() 
    + ' Ti.Gesture.orientation=' + Ti.Gesture.orientation 
    + ' platform.orientation=' + platform.orientation, ['platform']);
  
  return _islandscape;  
};

platform.blurChildren = function(view) {
  // Loop all children on the view calling blur until the keyboard disappears  
  function iterate(item) {
    if (typeof(item.blur) == 'function') {
      item.blur();
    }
    
    // Break out of loop once the keyboard is gone
    if (OS_IOS && ! Ti.App.keyboardVisible) {
      return;
    }

    if (item.views !== undefined) { // scrollable view
      for (var i in item.views) {
        iterate(item.views[i]);
      }
    }

    if (item.sections !== undefined) {   // table view
      for (var i in item.sections) {
        iterate(item.sections[i]);
      }
    }

    if (item.rows !== undefined) {   // table rows
        for (var i in item.rows) {
          iterate(item.rows[i]);
        }
      }

    if (item.children !== undefined) { // view
      for (var i in item.children) {
        iterate(item.children[i]);
      }
    }
  };

  if (OS_ANDROID || Ti.App.keyboardVisible) {
    iterate(view);
  }
};

platform.focusFirst = function(view) {
  // Loop all children on the view calling blur until the keyboard disappears  
  function iterate(item) {
    if (typeof(item.focus) == 'function') {
      item.focus();
      //return;
    }
    
    // Break out of loop once the keyboard is gone
    if (Ti.App.keyboardVisible) {
      return;
    }

    if (item.views !== undefined) { // scrollable view
      for (var i in item.views) {
        iterate(item.views[i]);
      }
    }

    if (item.sections !== undefined) {   // table view
      for (var i in item.sections) {
        iterate(item.sections[i]);
      }
    }

    if (item.rows !== undefined) {   // table rows
        for (var i in item.rows) {
          iterate(item.rows[i]);
        }
      }

    if (item.children !== undefined) { // view
      for (var i in item.children) {
        iterate(item.children[i]);
      }
    }
  };

  iterate(view);
};

platform.hideKeyboard = function(viewOrTextField) {
  viewOrTextField = viewOrTextField || $.mainview;  
  (OS_IOS && viewOrTextField) && platform.blurChildren(viewOrTextField);
  OS_ANDROID && Ti.UI.Android.hideSoftKeyboard();
};

platform.showKeyboard = function(viewOrTextField) {
  viewOrTextField = viewOrTextField || $.mainview;  
  logInfo('platform.showkeyboard: Ti.App.keyboardVisible=' + Ti.App.keyboardVisible);
  (viewOrTextField) && platform.focusFirst(viewOrTextField);
  OS_ANDROID && Ti.UI.Android.hideSoftKeyboard();
};
exports.platform = platform;

var config = {
  isdebugmode: true,
  isnewsetup: true,
  // Foursquare keys for foodfriend
  fsclientid: 'HP13BWUUSI54TPRSVSYVIWDUAFPRULAJUVIQF5JUKZHG4BTV',
  fsclientsecret: 'JKE32GAYMW1TWRVGG2QZGY0WKXHNRD2KS2ITGO50NB3NPFES',
  fsusertoken: '',
  dietPrefs: ['Vegan'],
  allergyPrefs: ['Gluten'],
};

config.load = function() {
  config.isnewsetup = Ti.App.Properties.getBool('isnewsetup', true);
  
  config.fsusertoken = Ti.App.Properties.getString('fsusertoken', '');
  config.dietPrefs = Ti.App.Properties.getList('diets', config.dietPrefs);
  config.allergyPrefs = Ti.App.Properties.getList('allergies', config.allergyPrefs);
};

config.save = function() {
  config.isnewsetup = false;
  Ti.App.Properties.setBool('isnewsetup', config.isnewsetup);

  Ti.App.Properties.setList('diets', config.dietPrefs);
  Ti.App.Properties.setList('allergies', config.allergyPrefs);
};

config.exists = function() {
  return ! config.isnewsetup;
};

exports.config = config;

function initFourSquare(_successCallback, _failureCallback) {
  // Initialise foursquare, login if required, return the controller interface for foursquare.callMethod and foursquare.callQuery
  if (undefined === Alloy.Globals.foursquare) {
    Alloy.Globals.foursquare = Alloy.createController('FourSquareLogin');
  }
  
  try {
    Alloy.Globals.foursquare.init(_successCallback);      
  } catch(E) {
    if (_.isFunction(_failureCallback)) {
      _failureCallback(E);
    } else {
      showError(E);
    }
  }
  return Alloy.Globals.foursquare;
};
exports.initFourSquare = initFourSquare;

if (Ti.Shadow) { 
  addSpy('platform',$.platform); 
  addSpy('config',$.config); 
  addSpy('lib',$); 
} 