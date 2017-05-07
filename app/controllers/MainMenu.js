exports.baseController = 'baseviewcontroller';
// var ligaturesymbols = require('/shared/IconicFont').IconicFont({
  // font: 'LigatureSymbols',
  // ligature: false // optional
// });
if (OS_ANDROID) {
  var MapModule = Alloy.Globals.Map;
  var rc = MapModule.isGooglePlayServicesAvailable();
  switch (rc) {
      case MapModule.SUCCESS:
          Ti.API.info('Google Play services is installed.');
          break;
      case MapModule.SERVICE_MISSING:
          alert('Google Play services is missing. Please install Google Play services from the Google Play store.');
          break;
      case MapModule.SERVICE_VERSION_UPDATE_REQUIRED:
          alert('Google Play services is out of date. Please update Google Play services.');
          break;
      case MapModule.SERVICE_DISABLED:
          alert('Google Play services is disabled. Please enable Google Play services.');
          break;
      case MapModule.SERVICE_INVALID:
          alert('Google Play services cannot be authenticated. Reinstall Google Play services.');
          break;
      default:
          alert('Unknown error.');
          break;
  }
}

var menuItems = [
  {properties: { itemId:"SearchMap" }, menuicon: { text: fa.locationArrow}, title:{text: "Browse near me"}, subtitle:{text:"Restaurants and shops near here"} },
  {properties: { itemId:"ScanReceipt" }, menuicon: {text: fa.camera}, title:{text:"Scan Receipt"}, subtitle:{text:"Scan your shopping list"} },
  {properties: { itemId:"FoodList" }, menuicon: {text: fa.check}, title:{text:"My Fridge"}, subtitle:{text:"Your fridge and ingredients"} },
  {properties: { itemId:"RateReview" }, menuicon: {text: fa.cutlery}, title:{text:"Rate and review"}, subtitle:{text:"Share your feedback and rating for this location"} },
];
$.menusection.setItems(menuItems);

var settingsItems = [
  {properties: { itemId:"Preferences" }, menuicon: {text: fa.apple}, title:{text: "My Preferences"}, subtitle:{text:"Set your dietary requirements"} },
  {properties: { itemId:"About" }, menuicon: {text: fa.commentO}, title:{text: "About"}, subtitle:{text:"About this app"} },
];
$.settingssection.setItems(settingsItems);

function handleItemClick(e) {
  $.lib.logInfo('List click on e.itemIndex=' + e.itemIndex + ' e.itemId=' + e.itemId);
  if (e.itemIndex == 0) {
    $.showController(e.itemId, {areasearch: true});
  } else if (e.itemIndex == 1) {
  	handleCameraButton();       
  } else {
    $.showController(e.itemId);
  }  
};

function handleCameraButton(e, callbackSuccess) {
  // Won't work in simulator
  if (Alloy.Globals.libdata.platform.isSimulator) {
    var imageTest = imageFile('appicon.png');
    if (callbackSuccess) {
      callbackSuccess(imageTest);
    }
    return imageTest;
  }

  // TODO: store image name, request whether to upload to facebook
  Ti.Media.showCamera({
    success: function(e) {
      // Could be video
      if (e.mediaType == Ti.Media.MEDIA_TYPE_PHOTO) {
        if (callbackSuccess) {
          callbackSuccess(e.media);
        }
        return e.media;
      }
      return;
    },

    cancel: function(){
    },

    error: function(error) {
      if (error.code == Ti.Media.NO_CAMERA) {
        alert(L('nocamera', 'Camera not available'));
      } else {
        alert('Camera error: ' + error.code);
      }
    },

    mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO],
    allowEditing: false,
    saveToPhotoGallery: true,
  });
};

function imageFile(fileName, returnNativePath) {
  // Return the local image resource or null. Try the one we installed first.
  // Note that the "proper" way is to prefix the /, whereas a non-prefixed "should" try a path relative to the
  // resources folder. Mileage varies.
  fileName = fileName.replace(/\//g, '_');
  var f;
  var basepath = Ti.Filesystem.applicationDataDirectory;
  var respath = Ti.Filesystem.resourcesDirectory;

  // Handle Ti.Shadow asset redirection
  if (Ti.Shadow) {
    var ospath = OS_ANDROID ? 'android/' : 'iphone/';
    basepath += Ti.App.name +'/' + ospath;
    respath += ospath;
  }

  // Try in Documents/ then Documents/images
  f = Ti.Filesystem.getFile(imagecache.imagedir + 'images/', fileName);

  f = Ti.Filesystem.getFile(basepath + 'images/', fileName);
  if (!f.exists()) {
    f = Ti.Filesystem.getFile(basepath + fileName);
  }
  if (!f.exists()) {
   f = Ti.Filesystem.getFile(respath, fileName);
  }
  if (!f.exists()) {
    f = Ti.Filesystem.getFile(respath + 'images/', fileName);
  }

  if (f.exists()) {
    if ((undefined !== returnNativePath) && (true === returnNativePath)) {
      return f.nativePath;
    } else {
      return f;
    }
  } else {
    return null;
  }
};

$.lib.initFourSquare();
