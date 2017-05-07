/*
 * Map view
 * 
 * Because the screen is closed between menu changes, we always load the last location 
 * in case it was the result of a manual search 
 * 
 * If the user is on a train, or has just started up the app elsewhere, they can press the userLocation pin 
 * on the map to re-centre themselves
 * 
 * At the moment the user can only search for a location, or filter to gluten, but ideally should be able to 
 * search on restaurant name etc
 * 
 */
exports.baseController = 'baseviewcontroller';

var Map = Alloy.Globals.Map;
var annotations = [];
var searchresults = [];
var searchfilters = [];
var returnedfilters = 0;
var limit = 100;
var layoutloaded = false;
var suppressRegionChanged = false;
var zoomlevel = 0;
var lastlocation = Ti.App.Properties.getObject('geolocation', { latitude:-37.814251, longitude:144.963169, zoomlevel: -1 });
var fitToAnnotations = true; // Recentre and resize the map to the search results on startup and after address search
var foursquare;
var activitytimer = -1;

if (OS_ANDROID && _.isFunction($.mapview.setEnableZoomControls)) {
  try {
    $.mapview.setEnableZoomControls(false); // use ours
  } catch(E) {
    $.lib.logError(E);
  }
}
$.zoomoutButton.title = fa.minus;
$.zoominButton.title = fa.plus;
$.locationButton.title = fa.locationArrow;
$.mainmenuButton.title = fa.bars;
$.filterButton.title = fa.filter;
$.activityView.hide();

$.lib.config.load();
createSearchFilter();

// We don't want default restaurants, schools etc
OS_IOS && ($.mapview.showsPointsOfInterest = false);
$.mapview.userLocation = true; // Show the users current location as a pin and a button allowing them to re-find it
$.mapview.addEventListener('complete', _.bind(handleMapLoaded, this));
$.mapview.addEventListener('regionchanged', _.bind(handleMapRegionChanged, this));

$.mapview.region = { latitude: lastlocation.latitude, longitude: lastlocation.longitude, latitudeDelta:0.02, longitudeDelta:0.02 };

function logLocation(info, lat, lon) {
  $.lib.logInfo(String.format(info + ' lat %2.5f lon %2.5f', lat, lon));  
};

function showActivityTimer(timeoutsec) {
  // Clear any running timer and restart
  if (activitytimer !== -1) {
    clearTimeout(activitytimer);
    activitytimer = -1;
  }
  
  activitytimer = setTimeout(function(e){
    hideActivity();
  }, timeoutsec * 1000);
  
  $.filterButton.hide();
  $.activityView.show();  
};

function hideActivity() {
  // Clear running timer
  if (activitytimer !== -1) {
    clearTimeout(activitytimer);
    activitytimer = -1;
  }
 
  $.activityView.hide();  
  $.filterButton.show();
};

function geocodeAddress(address, callbackSuccess, callbackFailure) {
  // Send off a request to Nominatum for the latitude + longitude which matches the given address
  // http://nominatim.openstreetmap.org/search?q=135+pilkington+avenue,+birmingham&format=json&polygon=0&addressdetails=1
  var newAddress = new String(address).replace(/\s+/g, "+");
  $.lib.logInfo('geocoding address ' + newAddress, ['search']);
  showActivityTimer(10);
  
  var geocodeXhr = Ti.Network.createHTTPClient({
    onload: function(e) {
      var responseAddress = JSON.parse(this.responseText);
      // If an array was returned, there is more than one possible match, ordered by "correctness"
      if (_.isArray(responseAddress)) {
        callbackSuccess(responseAddress[0], responseAddress.length);          
      } else {
        callbackSuccess(responseAddress, 1);                    
      }
      },
    onerror: function(e) {
      $.lib.logError(e.error);
      callbackFailure({e:e});
    },
    timeout: 10000,
  });
  
  geocodeXhr.open('GET', 'http://nominatim.openstreetmap.org' + '/search?q=' +
    newAddress + '&format=json&polygon=0&addressdetails=1' +
    '&accept-language=en-gb' +                // 'en-gb' -- not the same as Ti.Locale.language
    '&countrycodes=gb'                   // 'gb'     
  );
  geocodeXhr.setRequestHeader('Content-Type','application/json; charset=utf-8');
  geocodeXhr.send();
  return;
};   

function createSearchFilter(dietPrefs, allergyPrefs) {
  // The arrays are the "names" of each allergy like "Gluten". 
  // We need to convert these to the search filter format (foursquare) which is "gluten_free"
  searchfilters = [];
  dietPrefs = dietPrefs || $.lib.config.dietPrefs;
  allergyPrefs = allergyPrefs || $.lib.config.allergyPrefs;
  _.each(dietPrefs, function(pref) {
    searchfilters.push(pref.toLowerCase());
  });
  _.each(allergyPrefs, function(pref) {
    searchfilters.push(pref.toLowerCase() + '_free');
  });
};

function handleClose(e) {
  $.platform.hideKeyboard($.mainview);
  $.mapview.removeEventListener('complete', handleMapLoaded);
  $.mapview.removeEventListener('regionchanged', handleMapRegionChanged);
  $.mainview.removeEventListener('close', handleClose);
  $.destroy();
};

function isLocationChange(changetype, newregion, writechange) {
  // Check whether each maploaded/mapregionchanged also requires us to requery foursquare
  // A map tile horizontal width at zoomlevel 10 is approx latitude-diff 0.02 and longitude vertical 0.02
  
  var latitudeDelta = Math.abs(newregion.latitude - lastlocation.latitude);
  var longitudeDelta = Math.abs(newregion.longitude - lastlocation.longitude);
  var isChange = ((latitudeDelta > 0.01) || (longitudeDelta > 0.01) || (zoomlevel > lastlocation.zoomlevel)) ? true : false;
  
  var willChange = (true === isChange) && (true === writechange);
  $.lib.logInfo('Update map:' + willChange + ' ' + String.format(changetype + ' new coords: %2.5f,%2.5f deltas: %2.5f %2.5f', newregion.latitude, newregion.longitude, latitudeDelta, longitudeDelta));
  if ((true === isChange) && (true === writechange)) {
    saveLocation(newregion);
  } 
  return isChange;
};

function saveLocation(coords) {
  lastlocation = {latitude: coords.latitude, longitude: coords.longitude, zoomlevel: zoomlevel};
  Ti.App.Properties.setObject('geolocation', lastlocation);
};

function handleMapLoaded(e) { 
  // nb. also occurs after a zoom-out
  if ((false === layoutloaded) || isLocationChange('maploaded', e.source.region, true)) {
    layoutloaded = true;
    
    foursquare = $.lib.initFourSquare(function(e){
      foursquare = e.module;
      loadVenuesByCoordinate(lastlocation);
    });
  }
};

function handleMapRegionChanged(e) {
  if ((false === layoutloaded) || (true === suppressRegionChanged)) {
    isLocationChange('mapregion-suppressed', {latitude: e.latitude, longitude: e.longitude}, false);
    hideActivity();
    return;
  }

  if (isLocationChange('mapregionchanged', {latitude: e.latitude, longitude: e.longitude}, true)) {
    loadVenuesByCoordinate({latitude: e.latitude, longitude: e.longitude});
  }
};
 
function handleZoomOutClick(e) {
  zoomlevel -= 1;
  $.mapview.zoom(-1);
};

function handleZoomInClick(e) {
  zoomlevel += 1;
  $.mapview.zoom(1);
};

function handleMapClick(evt) {
  if (evt && evt.annotation) {
    if ((evt.clicksource === 'rightButton') || (evt.clicksource === 'infoWindow')) {
      if (evt.annotation.shop) {
        var controller = Alloy.createController('ShopCategoryList', {title: evt.annotation.title});
        controller.openWindow({modal: true});                
      } else if (evt.annotation.menu) {
        // var controller = Alloy.createController('RestaurantMenu', {title: evt.annotation.title, menuUrl: evt.annotation.menuUrl});
        // controller.openWindow({modal: true});        
      }
    } else {
      Ti.API.info("Annotation " + evt.title + " clicked, id: " + evt.annotation.myid);
    }
  }
};

function newVenue() {
  // Return a new venueSearchResult
  return {
    name: '',
    catname: '',
    latitude: 0,
    longitude: 0,
    filters: [],
    isCoffee: false,
    isRestaurant: false,
    isSupermarket: false,
    isBar: false,
    icon: null,
    menuUrl: null,
  };  
};

function findVenue(name, latitude, longitude) {
  // Return the matching venue from our list if we already have it, or append a new one
  var _venue = _.find(searchresults, function(searchResult) {
    return ((searchResult.latitude === latitude) && (searchResult.longitude === longitude) && searchResult.name.sameText(name)); 
  });
  if (undefined === _venue) {
    _venue = newVenue();
    _venue.name = name;
    _venue.latitude = latitude;
    _venue.longitude = longitude;
    searchresults.push(_venue);
  }
  return _venue;
};

function sortByName(venues) {
  venues.sort(function(a,b){
    if(a.name == b.name) return 0;
    return (a.name < b.name) ? -1 : 1;
  });    
};

function sortByFilterCount(venues) {
  // Reverse sort - more matches to the top
  venues.sort(function(a,b){
    if(a.filters.length == b.filters.length) return 0;
    return (a.filters.length > b.filters.length) ? -1 : 1;
  });    
};

function onFilterComplete(filtercount) {
  // We send off synchronous requests for each filter type. When they have all returned, postprocess the results and display on the map
  annotations = [];
  var hasMatchedSupermarket = false;
  var hasMatchedRestaurant = false;
  var maxlen = searchfilters.length > 2 ? 15 : 30; // Limit to keep the display tidy
  searchresults.sort(function(a,b){
    if(a.filters.length == b.filters.length) return 0;
    return (a.filters.length > b.filters.length) ? -1 : 1;
  }); 
  
  _.each(searchresults, _.bind(function(venue, index, list) {
    if (annotations.length < maxlen) {
      var name = venue.name;
      var subtitle = ''; 
      if (venue.menuUrl) {
        subtitle += '[menu]';
      }
      if (filtercount > 1) {
        subtitle += '[';
        for (var x=0; x<venue.filters.length; x++) {
          subtitle += venue.filters[x].substr(0,1).toUpperCase();
          if (x < venue.filters.length - 1) {
            subtitle += ',';
          }
        }
        subtitle += '] ';
      }
      subtitle += venue.catname;
  
      var righticon = null;
      if (venue.isRestaurant) {
        righticon = '/images/menu.jpg';
        venue.icon = (venue.filters.length === filtercount) ? '/images/restaurantgreen.jpg' : '/images/restaurantyellow.jpg';
        hasMatchedRestaurant = hasMatchedRestaurant || (venue.filters.length === filtercount);
      } else if (venue.isSupermarket) {
        righticon = '/images/shop.jpg';
        venue.icon = (venue.filters.length === filtercount) ? '/images/shopgreen.jpg' : '/images/shopyellow.jpg';
        hasMatchedSupermarket = true; //hasMatchedSupermarket || (venue.filters.length === filtercount);
      }
      
      var ann = Map.createAnnotation({
        latitude: venue.latitude,
        longitude: venue.longitude,
        title: name,
        subtitle: subtitle,
        image: venue.icon,
        rightButton: righticon,
        myid: index, 
        menu: venue.isRestaurant,
        shop: venue.isSupermarket,
        menuUrl: venue.menuUrl,
      });
      annotations.push(ann);
    }
  }, this));    
           
  // If we need fake data, plug some in    
  if (annotations.length > 2) {
    if (false === hasMatchedSupermarket) {
      annotations[0].title = 'Hals Wholefoods';
      annotations[0].subtitle = 'Organic wholefoods'; 
      annotations[0].image = '/images/shopblue.jpg';
      annotations[0].shop = true;
      annotations[0].menu = false;
      annotations[0].rightButton = '/images/shop.jpg';        
    }
  }
  
  hideActivity();
  suppressRegionChanged = false; // So that it only triggers when all filters return
  $.mapview.annotations = annotations;
  
  // Fit the map to the new annotations if this was the result of an address lookup
  if ((annotations.length > 0) && (true === fitToAnnotations) && _.isFunction($.mapview.showAnnotations)) {
    $.lib.logInfo('Fitting map to annotations');
    fitToAnnotations = false;
    try {
      $.mapview.showAnnotations(annotations);
    } catch(E) {
      $.lib.logError('$.mapview.showAnnotations() failed with ' + E.message);
    }
  }              
};
 
function queryFilterType(filter, locationlookup, filterindex, filtercount, callBack) {
  // Requery for each independent filter type as foursquare queries only support a single search term
  // See https://developer.foursquare.com/docs/venues/explore
  //   doQuery('venues/explore', 'v=20140701&ll=' + +coords.latitude +',' + +coords.longitude + '&radius=3000&query=vegan&sortByDistance=1&limit=' + limit', false);
  //
  // Note OpenStreetMap allows specific dietary queries 
  //   http://wiki.openstreetmap.org/wiki/Key:diet#Examples
  //   http://tools.wmflabs.org/query2map/featurelist.php?key=amenity&value=restaurant&key=diet:gluten_free&value=&types=points-areas-infos&BBOX=-0.1306,50.8388,-0.1206,50.8488
  //   http://overpass-turbo.eu/?Q=%3Cquery%20type%3D%22way%22%3E%0A%20%20%3Chas-kv%20k%3D%22maxspeed%22%2F%3E%0A%20%20%3Caround%20lat%3D%2251.87810%22%20lon%3D%224.52587%22%20radius%3D%2230%22%2F%3E%0A%3C%2Fquery%3E%0A%3Cunion%3E%0A%20%20%3Citem%2F%3E%0A%20%20%3Crecurse%20type%3D%22down%22%2F%3E%0A%3C%2Funion%3E%0A%3Cprint%2F%3E&C=51.8788;4.52725;17
  if (! foursquare) return;
  filterindex = filterindex || 0;
  
  function onSuccess(e) {
    if (undefined === e) {
      onError(e);
      return;
    }
    
    var result = JSON.parse(e);
    if (result.meta && result.meta.code === 200) {
      $.lib.logInfo('code=' + result.meta.code + ' filter=' + filter +  ' resultcount=' + result.response.totalResults);
      
      if (result.response.groups && (result.response.groups.length > 0)) {
        var items = result.response.groups[0].items;
        var len = Math.min(items.length, limit);
        for (var i=0; i<len; i++) {
          if (_.isObject(items[i].venue) && _.isObject(items[i].venue.location) && _.isArray(items[i].venue.categories) && (items[i].venue.categories.length > 0)) {
            var venue = items[i]['venue'];
            var isCoffee = false;
            var isRestaurant = false;
            var isSupermarket = false;
            var isBar = false;
            var icon = null;
            var menuUrl = undefined;
            var name = venue.name;
            var catname = venue.categories[0].name;
            isRestaurant = catname.contains('restaurant');
            isBar = catname.contains('pub') || catname.contains('bar');
            isCoffee = catname.contains('coffee') || catname.contains('caf');
            isSupermarket = catname.contains('supermarket') || catname.contains('wholefood');
            if (venue.menu && venue.menu.mobileUrl) {
              menuUrl = venue.menu.mobileUrl;
            }
            icon = isSupermarket ? '/images/shop.jpg' : (isCoffee ? '/images/coffee.jpg' : (isRestaurant ? '/images/restaurant.jpg' : (isBar ? '/images/pub.jpg' : null)));
            if (icon === null) {
              continue; // Doesn't match any of the categories we want
            }
            var newvenue = findVenue(name, venue.location.lat, venue.location.lng);
            newvenue.catname = catname;
            newvenue.isCoffee = newvenue.isCoffee || isCoffee;
            newvenue.isRestaurant = newvenue.isRestaurant || isRestaurant;
            newvenue.isSupermarket = newvenue.isSupermarket || isSupermarket;
            newvenue.isBar = newvenue.isBar || isBar;
            newvenue.icon = icon;
            newvenue.menuUrl = menuUrl || newvenue.menuUrl;
            newvenue.filters.push(filter);
          }
        }
      }
    }
    
    if (result.response.geocode && result.response.geocode.center) {
      lastlocation.latitude = result.response.geocode.center.lat;
      lastlocation.longitude = result.response.geocode.center.lng;
    }
    if (callBack) {
      callBack(filterindex);
    }
  };
  
  function onError(e) {
    $.lib.logError('Error response from FS');
    if (callBack) {
      callBack(filterindex);
    }
  };
                  
  var params = locationlookup + '&radius=3000&sortByDistance=1&limit=' + limit;    
  params += (filter === '') ? '' : '&query=' + filter;             
  foursquare.callQuery('venues/explore', params, onSuccess, onError);
};

function handleMainMenuClick(e) {
  $.showMainMenu();
};

function handleFilterChanged(dietFilter, allergyFilter) {
  // User has returned from the filter page, update and force a search
  createSearchFilter(dietFilter, allergyFilter);
  fitToAnnotations = true;
  loadVenuesByCoordinate(lastlocation);
};

function handleFilterClick(e) {
  var filtercontroller = Alloy.createController('Preferences');
  filtercontroller.showFilter(_.bind(handleFilterChanged, this));
  filtercontroller.openWindow({modal: true});
};

function handleUserLocationClick(e) {
  _.debounce(getUserLocation(e), 500, true);
};

function handleDebouncedSearch(e) {
  function onLocationFound(e, matchcount) {
    if (undefined !== e) {
      $.lib.logInfo('Searching near geocoded address: ' + e.display_name.replace(/, European Union/g, ""));
      suppressRegionChanged = false; 
      fitToAnnotations = true;
      $.mapview.region = {latitude: e.lat, longitude: e.lon};   
    }
  };
  
  function onLocationNotFound(e, matchcount) {
    alert('Could not find a location matching ' + area);
  };

  var area = $.search.value || '';
  if (area !== '') {
    geocodeAddress(area, onLocationFound, onLocationNotFound);     
  }
};

function handleSearchReturn(e) {
  $.platform.hideKeyboard(e.source);
  _.debounce(handleDebouncedSearch(e), 500, true);
};

function getUserLocation() {
  if (Ti.Geolocation) { // && ! $.lib.platform.isSimulator) {
    Ti.Geolocation.purpose = 'To find nearby places.';
    Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
    Ti.Geolocation.distanceFilter = 0;
    showActivityTimer(10);
    Ti.Geolocation.getCurrentPosition(function (e) {
      if (!e.success || e.error) {
        Ti.API.info('Error getting user location');
      } else {
        suppressRegionChanged = false; 
        fitToAnnotations = true;
        $.mapview.region = { latitude: e.coords.latitude, longitude: e.coords.longitude };
      }
    });
  }
};

function loadVenuesByCoordinate(coords) {
  // When the map has changed via scroll or zoom, requery foursquare 
  if (! foursquare) return;
  showActivityTimer(10);

  var currentfilter = 0;
  returnedfilters = 0;
  searchresults = []; 
  suppressRegionChanged = true; // So that it only triggers when all filters return in onFilterComplete
  
  function doNextFilter() {
    if (currentfilter < searchfilters.length) {
      $.lib.logInfo('Processing filter ' + currentfilter + ' of ' + searchfilters.length + ' [' + searchfilters[currentfilter] + ']');
      queryFilterType(searchfilters[currentfilter], locationlookup, currentfilter, searchfilters.length, function(filterindex) {
        currentfilter += 1;        
        return doNextFilter();
      });
    } else {
      $.lib.logInfo('All filters returned, processing');
      onFilterComplete(searchfilters.length);
    }
    
  };
  
  function doNoFilter() {
    // No filter is set - just get all venues
    queryFilterType('', locationlookup, 0, 0, function(filterindex) {
      currentfilter += 1;        
      return doNextFilter();
    });
  };
  
  var locationlookup = 'll=' + +coords.latitude +',' + +coords.longitude;
  if (searchfilters.length === 0) {
    doNoFilter();
  } else {
    // We only have one foursquare.js-xhr, so cannot do async calls
    doNextFilter();
  }    
};

exports.handleClose = handleClose;

