/*
 * Dietary and allergy preferences screen
 * 
 * Dual purpose
 *   1. User preferences selection - saved and loaded to properties
 *   2. Modal filter selection - in-memory only and used for overriding search
 */
exports.baseController = 'baseviewcontroller';

var isFilter = false;
var filterCallback = null;
var inputDialogStyle = OS_IOS ? Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT : null;

$.filterView.hide();
exports.showFilter = function(callback) {
  $.headerLabel.text = 'Search Preferences';
  $.listsView.top = 145;
  $.filterView.show();  
  isFilter = true;
  filterCallback = callback;
};

function handleFilterClick(e) {
  if ($.win) {
    $.win.close();
  } else {
    $.showMainMenu();
  }
  if (_.isFunction(filterCallback)) {
    filterCallback(selectedDietPrefs(), selectedAllergyPrefs());
  }  
};

$.lib.config.load();
$.allergyAddButton.title = fa.plus;
$.dietAddButton.title = fa.plus;
$.filtericonLabel.text = fa.filter;
$.allergylistview.left = $.platform.workingWidth / 2;
$.allergylistview.width = $.platform.workingWidth / 2;
$.dietlistview.width = $.platform.workingWidth / 2;

$.mainview.addEventListener('close', handleClose);

var deselectedColor = '#b3b2b4';
var selectedColor = '#5ea5f2';
var diets = ['Halal', 'Low-carb', 'Ovo-vegetarian', 'Paleo', 'Vegan', 'Vegetarian'];
var allergies = ['Banana', 'Dairy', 'Egg', 'Gluten', 'Nuts', 'Peanuts', 'Seafood', 'Sesame', 'Soy', 'Wheat'];
var dietItems = [];
var allergyItems = [];

_.each(diets, function(diet, index, list) {
  var isPref = (_.indexOf($.lib.config.dietPrefs, diet) > -1) ? true : false;  
  if (true === isPref) {
    dietItems.push({properties: { itemId:diet, accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, title:{text: diet, color: selectedColor} });
  } else {
    dietItems.push({properties: { itemId:diet, accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE }, title:{text: diet, color: deselectedColor} });
  }
});
$.dietsection.setItems(dietItems);
  
_.each(allergies, function(allergy, index, list) {
  var isPref = (_.indexOf($.lib.config.allergyPrefs, allergy) > -1) ? true : false;  
  if (true === isPref) {
    allergyItems.push({properties: { itemId:allergy, accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, title:{text: allergy, color: selectedColor} });
  } else {
    allergyItems.push({properties: { itemId:allergy, accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE }, title:{text: allergy, color: deselectedColor} });
  }
});
$.allergysection.setItems(allergyItems);

function selectedDietPrefs() {
  // Return the array of dietary preferences selected on the screen
  var _dietprefs = [];
  for (var i=0; i<$.dietsection.items.length; i++) {
    var item = $.dietsection.getItemAt(i);
    var isSelected = (item.properties.accessoryType === Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK) ? true : false;
    if (isSelected) {
      _dietprefs.push(item.title.text);
    }
  }
  return _dietprefs;
};

function selectedAllergyPrefs() {
  // Return the array of allergy preferences selected on the screen
  var _allergyprefs = [];
  for (var i=0; i<$.allergysection.items.length; i++) {
    var item = $.allergysection.getItemAt(i);
    var isSelected = (item.properties.accessoryType === Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK) ? true : false;
    if (isSelected) {
      _allergyprefs.push(item.title.text);
    }
  }
  return _allergyprefs;
};

function handleSwitchChange(e) {
  var isOn = (true == $.usePreferenceSwitch.value) ? true : false;
  for (var i=0; i<$.allergysection.items.length; i++) {
    var item = $.dietsection.getItemAt(i);
    itemSelected($.dietsection, i, isOn && (_.indexOf($.lib.config.dietPrefs, item.properties.itemId) > -1));
  }
  for (var i=0; i<$.allergysection.items.length; i++) {
    var item = $.allergysection.getItemAt(i);
    itemSelected($.allergysection, i, isOn && (_.indexOf($.lib.config.allergyPrefs, item.properties.itemId) > -1));
  }
};

function Save() {
  if (false === isFilter) {
    $.lib.logInfo('Preferences: saving changes');
    $.lib.config.dietPrefs = selectedDietPrefs();
    $.lib.config.allergyPrefs = selectedAllergyPrefs();
    $.lib.config.save();
  }
};

function handleInputReturn(e) {
  $.platform.hideKeyboard(e.source);
  Save();
};

function handleClose(e) {
  $.platform.hideKeyboard($.mainview);
  $.mainview.removeEventListener('close', handleClose);
  //$.destroy();
};

function handleDietAddClick(e) {
   var dialog = Ti.UI.createAlertDialog({
    cancel: 0,
    title: 'Add a new diet type',
    message: '',
    text: '',
    style: inputDialogStyle,
    buttonNames: ['Cancel', 'Save'],
  });
  dialog.addEventListener('click', function(e){
    if (e.index === e.source.cancel) {
      return;
    }
    
    var newitemname = e.text;
    if (newitemname !== '') {
      var newitem =
        {properties: { itemId:"99", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: e.text, color: selectedColor} };
      $.dietsection.appendItems([newitem]);
    }
  });
  dialog.show();
};

function handleAllergyAddClick(e) {
   var dialog = Ti.UI.createAlertDialog({
    cancel: 0,
    title: 'Add a new allergy type',
    message: '',
    text: '',
    style: inputDialogStyle,
    buttonNames: ['Cancel', 'Save'],
  });
  dialog.addEventListener('click', function(e){
    if (e.index === e.source.cancel) {
      return;
    }
    
    var newitemname = e.text;
    if (newitemname !== '') {
      var newitem = {properties: { itemId:"99", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, title:{text: e.text, color: selectedColor} };
      $.allergysection.appendItems([newitem]);
    }
  });
  dialog.show();
};

function itemSelected(section, index, selected) {
  var item = section.getItemAt(index);
  if (true === selected) {
    item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
    item.title.color = selectedColor;
  } else {
    item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
    item.title.color = deselectedColor;
  }
  section.updateItemAt(index, item);  
};

function handleItemClick(e) {
  var item = e.section.getItemAt(e.itemIndex);
  var wasSelected = (item.properties.accessoryType === Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK) ? true : false;
  itemSelected(e.section, e.itemIndex, !wasSelected);
  
  if (false === isFilter) {
    Save();
  }
};

function handleSwitchChange(e) {
  var isOn = (true == $.usePreferenceSwitch.value) ? true : false;
  for (var i=0; i<$.dietsection.items.length; i++) {
    var item = $.dietsection.getItemAt(i);
    itemSelected($.dietsection, i, isOn && (_.indexOf($.lib.config.dietPrefs, item.properties.itemId) > -1));
  }
  for (var i=0; i<$.allergysection.items.length; i++) {
    var item = $.allergysection.getItemAt(i);
    itemSelected($.allergysection, i, isOn && (_.indexOf($.lib.config.allergyPrefs, item.properties.itemId) > -1));
  }
};

exports.handleClose = handleClose;

