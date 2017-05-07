/* Inheritable controller for app views with navigation assist
 *
 * "Convention over configuration": all mainviews should be called $.mainview
 */
var args = arguments[0] || {};
var win;
exports.args = args;

var lib = Alloy.Globals.lib;
exports.lib = lib;
exports.platform = lib.platform;

exports.showMainMenu = function() {
	if (OS_IOS) {
		Alloy.Globals.drawer.toggleLeftWindow();
	} else {
		$.showController('MainMenu');
	}
};

exports.showController = function(controllername, cargs) {
	if (Alloy.Globals.activecontroller) {
		// Same? - Reshow it.
		if ((Alloy.Globals.activecontroller.__controllerPath === controllername) && (undefined === cargs)) {
			if (false === $.lib.platform.isTablet) {
				if (OS_IOS) {
					Alloy.Globals.drawer.closeLeftWindow();
				}
			}
			return Alloy.Globals.activecontroller;
		}

		// New selection?
		if (OS_IOS && _.isFunction(Alloy.Globals.activecontroller.close)) {
			Alloy.Globals.activecontroller.close();
		} else {
			Alloy.Globals.activecontroller.destroy();
			//Alloy.Globals.centerWindow.close(); -- will call the window.close() listener IFF the container was a listener and not a view
		}
		if (Alloy.Globals.centerWindow) {
			Alloy.Globals.centerWindow.remove(Alloy.Globals.activeview);
		}
	}

	/* So maybe the leftwindows can be replaced, but not the center window -- need to look at drawer.open() source */
	Alloy.Globals.activecontroller = Alloy.createController(controllername, cargs);
	Alloy.Globals.activeview = Alloy.Globals.activecontroller.getView();

	if (OS_IOS) {
		Alloy.Globals.drawer.leftDrawerWidth = Ti.Platform.displayCaps.platformWidth - 30;
		Alloy.Globals.centerWindow.add(Alloy.Globals.activeview);
		if (false === $.lib.platform.isTablet) {
			Alloy.Globals.drawer.closeLeftWindow();
		}
	} else {
		if (!Alloy.Globals.centerWindow) {
			Alloy.Globals.centerWindow = Ti.UI.createWindow(cargs);
			Alloy.Globals.centerWindow.addEventListener('open', function(e) {
				e.source.activity.actionBar.hide();
			});
		}
		_.extend($, {
			win : Alloy.Globals.centerWindow
		});
		Alloy.Globals.centerWindow.add(Alloy.Globals.activeview);
		Alloy.Globals.centerWindow.open();
	}

	return Alloy.Globals.activecontroller;
};

exports.baseStartLoading = function(view) {
	// Indicates that the controller+view is configured with properties and events
	// and can call showNow() when it is completed populating data.
	if (Ti.Shadow && $.__controllerPath) {
		$.lib.logInfo('Ti.Shadow addSpy ' + $.__controllerPath);
		addSpy($.__controllerPath, $);
		// this? _.extend($, exports);
	}

	if ( typeof ($.startLoading) == 'function') {
		$.startLoading();
	} else if (view && view.showNow) {// TODO: getview
		view.showNow(false);
	}
};

exports.baseAfterClose = function() {
	$.destroy();
};

exports.baseRelayout = function() {
	// Relayout the view (eg. when the orientation changes)
	if (_.isFunction($.relayout)) {
		$.relayout();
	}
};

exports.openWindow = function(opts) {
	if (!win) {
		win = Ti.UI.createWindow(opts);
		_.extend($, {
			win : win
		});
		if (OS_ANDROID) {
			win.addEventListener('open', function(e) {
				e.source.activity.actionBar.hide();
			});
		}
	}
	if ($.mainview) {
		win.add($.mainview);
	}
	win.open(opts);
};

exports.close = function(e) {
	$.lib.logInfo('baseviewcontroller.close ' + $.__controllerPath);
	if (_.isFunction($.handleClose)) {
		$.handleClose(e);
	}
	$.destroy();
	if (win) {
		if ($.mainview) {
			win.remove($.mainview);
			$.mainview = null;
		}
		win.close();
		win = null;
	}
};
exports.closeWindow = exports.close;

if (Ti.Shadow) {
	addSpy('baseviewcontroller', $);
} 