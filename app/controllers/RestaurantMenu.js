exports.baseController = 'baseviewcontroller';

$.webView.autodetect = [Ti.UI.AUTOLINK_NONE];
$.backiconButton.title = fa.angleLeft;
if ($.args.title) {
	$.headerLabel.text = $.args.title;
}
var isMenu = _.isString($.args.menuUrl) ? true : false;
var isParsed = false;
if (isMenu) {
	$.webView.url = $.args.menuUrl;
} else {
	$.webView.url = 'menu.html';
}

function parseHtml() {
	if (false === isParsed) {
		isParsed = true;
		var inHtml = $.webView.getHtml();

		var diets = ['Halal', 'Low-carb', 'Ovo', 'Paleo', 'Vegan', 'Vegetarian'];
		var allergies = ['Banana', 'Bread', 'Berry', 'Berries', 'Dairy', ' Egg', 'Gluten', 'Nuts', ' Peanuts', 'Seafood', 'Sesame', 'Soy', 'Wheat'];
		var outHtml = inHtml;
		_.each(diets, function(item, index) {
			var regex = new RegExp(item, "ig");
			outHtml = outHtml.replace(regex, '<font color="green">[' + item.substr(0, 1) + ']' + item + '</font>');
		});
		_.each(allergies, function(item, index) {
			var regex = new RegExp(item, "ig");
			outHtml = outHtml.replace(regex, '<font color="red">[' + item.substr(0, 1) + ']' + item + '</font>');
		});
		outHtml = outHtml.replace(/img src/g, 'img xsrc');

		if (outHtml !== inHtml) {
			$.webView.setHtml(outHtml);
		}
	}
};

function handleWebviewLoad(e) {
	if (isMenu) {
		$.lib.logInfo('Loaded: ' + $.webView.url);
		parseHtml();
	}
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

