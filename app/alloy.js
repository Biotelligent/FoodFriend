// In ECMA 5.0, but not in Ti.String, yet.
if (!String.prototype.trim) {
  //code for trim
  String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
  String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
  String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
  String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};
}
if (typeof String.prototype.endsWith === 'undefined') {
  String.prototype.endsWith = function(suffix) {
    return this.toLowerCase().indexOf(suffix.toLowerCase(), this.length - suffix.length) !== -1;
  };
}
if (typeof String.prototype.startsWith === 'undefined') {
  String.prototype.startsWith = function(prefix) {
    return (this.substr(0, prefix.length).toLowerCase() === prefix.toLowerCase());
  };
}
if (typeof String.prototype.contains === 'undefined') {
  String.prototype.contains = function(sub) {
    return this.toLowerCase().indexOf(sub.toLowerCase()) !== -1;
  };
}
if (typeof String.prototype.containsText === 'undefined') {
  String.prototype.containsText = function(sub) {
    return this.toLowerCase().indexOf(sub.toLowerCase()) !== -1;
  };
}
if (typeof String.prototype.sameText === 'undefined') {
  String.prototype.sameText = function(sub) {
    return this.toLowerCase() === sub.toLowerCase();
  };
}

// Radians for coordinate based distance calculations
if (typeof(Number.prototype.toRad) === 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  };
}
 
if (typeof(Number.prototype.toDeg) === 'undefined') {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  };
}

// Day of year and week of year
if (typeof(Date.prototype.dayOfYear) === 'undefined') {
  Date.prototype.dayOfYear = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    return Math.ceil((this - onejan) / 86400000);
  }; 
}

if (typeof(Date.prototype.weekOfYear) === 'undefined') {
  Date.prototype.weekOfYear = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
  }; 
}

if (typeof(Date.prototype.julianDay) === 'undefined') {
  Date.prototype.julianDay = function() {
    return Math.ceil(this / 86400000);
  }; 
}

var fa = require('/shared/FontAwesome');
Alloy.Globals.FontAwesome = OS_ANDROID ? 'fontawesome-webfont' : 'FontAwesome';
Alloy.Globals.Map = require('ti.map');

Ti.API.info('Alloy.js: creating controller libraries');
Alloy.Globals.lastIndex = -1;
Alloy.Globals.Controllers = {};
Alloy.Globals.lib = Alloy.createController('libdata');


