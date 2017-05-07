/*
 * Foursquare oAuth login
 * 
 * Create as a controller and call the methods required - the UI is shown automatically if the user is not yet authenticated
 * 
 * Use foursquare.callMethod to perform an API function like check-in
 * Use foursquare.callQuery to run an API query like /explore
 */
exports.baseController = 'baseviewcontroller';

$.webView.autodetect = [Ti.UI.AUTOLINK_NONE];

var clientId = 'HP13BWUUSI54TPRSVSYVIWDUAFPRULAJUVIQF5JUKZHG4BTV';
var clientSecret = 'JKE32GAYMW1TWRVGG2QZGY0WKXHNRD2KS2ITGO50NB3NPFES';
var redirectUri = 'http://www.biotelligent.co.uk/safe2eat.html';
var token = Ti.App.Properties.getString('fstoken', '');
var fsUrl = 'https://api.foursquare.com/v2/';
var fsApiVersion = '&v=20140701';
var fsXhr = null;
var successCallback;

function handleCloseClick(e) {
  if ($.win) {
    $.win.close();
  }
};

function handleWebviewBeforeLoad(e) {
  $.lib.logInfo('Foursquare webview.beforeload: e.url=' + JSON.stringify(e));
  if (e.url.indexOf('www.foursquare.com/') != -1) {
    $.webView.stopLoading = true;
    authorizeUICallback(e);
  }  
};

function handleWebviewLoad(e) {
  authorizeUICallback(e);
};

function handleAuthorized() {
  // Return the access_token in the callback when the user is authorized
  if ((token !== '') && _.isFunction(successCallback)) {
    successCallback({access_token: token, module: Alloy.Globals.foursquare});
  }
};

/*
* fires an event when login fails 
*/
function authorizeUICallback(e) {
  $.lib.logInfo('authorizeUILoaded ' + JSON.stringify(e));

  // A success response will look like {"url":"http://www.biotelligent.co.uk/foodfriend.html#access_token=HCGSV1QOFKFNWFHWD2WKUM0IN1GXDEUGXNORB5NIRG33AAGX" }
  if (e.url.indexOf('#access_token') != -1)
  {
      token = e.url.split("=")[1];
      $.lib.logInfo('FS Authorized, token = ' + token);
      Ti.App.Properties.setString('fstoken', token);
      destroyAuthorizeUI();
      handleAuthorized();
  } else if ('http://foursquare.com/' == e.url) {
      Ti.App.fireEvent('app:4square_logout', {});
      destroyAuthorizeUI();
  } else if (e.url.indexOf('#error=access_denied') != -1) {
      Ti.App.fireEvent('app:4square_access_denied', {});
      destroyAuthorizeUI();
  }
};

/*
* unloads the UI used to have the user authorize the application
*/
function destroyAuthorizeUI() {
  $.lib.logInfo('destroyAuthorizeUI');
  // if the window doesn't exist, exit
  if (($.webView == null) || ($.win == null)) {
    return;
  }

  // remove the UI
  if ($.webView && (null !== $.webView)) {
    try {
      Ti.API.info('destroyAuthorizeUI:window.close()');
      $.webView.hide();
      if ($.win) {
        $.win.close();
      }
    }
    catch(E)
    {
      $.lib.logError('Cannot destroy the authorize UI. Ignoring. ' + E.message);
    }
  }
};

function init(_successCallback, _clientId, _redirectUri, _accesstoken) {
  // Initialise with the foursquare settings, return true & run the callback if we are already authorized
  clientId = _clientId || clientId;
  redirectUri = _redirectUri || redirectUri;
  token = _accesstoken || token;
  successCallback = _successCallback || successCallback;
  

  // If a "successCallback" is passed, automatically show the UI if required
  if ((token === '') && _.isFunction(_successCallback)) {
    login(_successCallback);
  } else  if (token !== '') {
    $.lib.logInfo('FourSquareLogin.init.already authorized: ' + token);
    handleAuthorized(token);    
  }
  
  return (token !== '') ? true : false;
};
exports.init = init;


/**
* displays the familiar web login dialog
*
*/
function login(_successCallback) {
  successCallback = _successCallback || successCallback;
  $.webView.url = String.format('https://foursquare.com/oauth2/authenticate?response_type=token&client_id=%s&redirect_uri=%s', clientId, redirectUri);
  $.openWindow({modal:true, fullScreen: true});
  return;
};
exports.login = login;

function logout() {
  // Authorize? Not authenticate...
  $.webView.url = String.format('https://foursquare.com/oauth2/authorize?response_type=token&client_id=%s&redirect_uri=%s', clientId, redirectUri);
  $.openWindow({modal:true, fullScreen: true});
  return;
};
exports.logout = logout;

function closeFSQWindow() {
  destroyAuthorizeUI();
};

function callMethod(method, GETorPOST, params, success, error) {
    //get the login information
    try {
        if (fsXhr == null) {
            fsXhr = Titanium.Network.createHTTPClient();
        }

        var dict = {};
        var getstr = fsUrl + method;
        if (method === 'GET') {
          getstr +=  + "?oauth_token=" + token + fsApiVersion + '&' + params;
          Ti.API.info('foursquare.callMethod: ' + GETorPOST + ' ' + getstr); 
        } else {
          dict = params || {};
          _.extend(dict, {oauth_token: token, v: '20140701'});
          Ti.API.info('foursquare.callMethod: ' + GETorPOST + ' ' + ' params:' + JSON.stringify(params)); 
        }
        fsXhr.open(GETorPOST, fsUrl);

        fsXhr.onerror = function(e) {
            Ti.API.error("foursquare ERROR " + e.error);
            Ti.API.error("foursquare ERROR " + fsXhr.location);
            Ti.API.error("foursquare ERROR " + JSON.stringify(e));
            if ( error ) {
              error(e);
            }
        };

        fsXhr.onload = function(_xhr) {
            Ti.API.info("foursquare response: " + fsXhr.responseText);
            if ( success ) {
              success(fsXhr);
            }
        };

        fsXhr.send(dict);
    } catch(err) {
        Titanium.UI.createAlertDialog({
            title: "Error",
            message: String(err),
            buttonNames: ['OK']
        }).show();
    }
};
exports.callMethod = callMethod; 

function callQuery(method, params, success, error) {
    //get the login information
    try {

        if (fsXhr == null) {
          fsXhr = Titanium.Network.createHTTPClient();
        }
        
        var getstr = fsUrl + method + "?oauth_token=" + token + fsApiVersion + "&" + params;
        Ti.API.info('foursquare.callQuery: ' + getstr); 
        fsXhr.open('GET', getstr);

        fsXhr.onerror = function(e) {
            Ti.API.error("foursquare ERROR " + e.error);
            Ti.API.error("foursquare ERROR " + fsXhr.location);
            Ti.API.error("foursquare ERROR " + JSON.stringify(e));
            if ( error ) {
              error(e);
            }
        };

        fsXhr.onload = function(_xhr) {
            //Ti.API.info("foursquare onl: " + _xhr.responseText);
            if (_xhr) {
              Ti.API.info("foursquare response: " + fsXhr.responseText);
              if ( success ) {
                success(fsXhr.responseText);
              }
            }
        };

        fsXhr.send({});
    } catch(err) {
        Titanium.UI.createAlertDialog({
            title: "Error",
            message: String(err),
            buttonNames: ['OK']
        }).show();
    }
};
exports.callQuery = callQuery;