exports.baseController = 'baseviewcontroller';

function handleDinnerClick(e) {
  if (e.source.color === '#e7e7e7') {
    e.source.color = 'orange';
  } else {
    e.source.color = '#e7e7e7';    
  }
};

$.lib.config.load();

$.expiryAddButton.title = fa.plus;
$.foodAddButton.title = fa.plus;
$.dinnerButton.text = fa.cutlery;
$.expirylistview.left = $.platform.workingWidth / 2;
$.expirylistview.width = $.platform.workingWidth / 2;
$.foodlistview.width = $.platform.workingWidth / 2;
$.mainview.addEventListener('close', handleClose);

var inputDialogStyle = OS_IOS ? Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT : null;
var deselectedColor = '#b3b2b4';
var selectedColor = '#5ea5f2';

var foodItems = [
  {properties: { itemId:"1", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Chickpeas", color: selectedColor} },
  {properties: { itemId:"2", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Mustard seeds", color: selectedColor} },
  {properties: { itemId:"3", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Plain flour", color: selectedColor} },
  {properties: { itemId:"4", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Vegetable stock", color: selectedColor} },
  {properties: { itemId:"5", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Brown rice", color: selectedColor} },
  {properties: { itemId:"6", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Spring onions", color: selectedColor} },
  {properties: { itemId:"7", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Flat leaf parsley", color: selectedColor} },
  {properties: { itemId:"8", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Olive oil", color: selectedColor} },
  {properties: { itemId:"1", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Walnuts", color: selectedColor} },
  {properties: { itemId:"9" }, menuicon: {text: ''}, title:{text: "Mint"} },
  {properties: { itemId:"10" }, menuicon: {text: ''}, title:{text: "Diced tomatoes"} },
  {properties: { itemId:"11", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK}, xmenuicon: {text: fa.check}, title:{text: "Kidney beans", color: selectedColor} },
];
$.foodsection.setItems(foodItems);

var expiryItems = [
  {properties: { itemId:"1", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Brown onion", color: selectedColor} },
  {properties: { itemId:"2", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Tomatoes", color: selectedColor} },
  {properties: { itemId:"3", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Peas", color: selectedColor} },
  {properties: { itemId:"4", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK }, xmenuicon: {text: fa.check}, title:{text: "Feta", color: selectedColor} },
  {properties: { itemId:"5", accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE }, xmenuicon: {text: fa.check}, title:{text: "Brussel sprouts", color: deselectedColor} },
];
$.expirysection.setItems(expiryItems);

function Save() {
  $.lib.logInfo('Searching spoonacular for recipes....');
};

function handleHeaderClick(e) {
  $.showMainMenu();  
};

function handleClose(e) {
  $.platform.hideKeyboard($.mainview);
  $.mainview.removeEventListener('close', handleClose);
  //$.destroy();
};

function handleFoodAddClick(e) {
   var dialog = Ti.UI.createAlertDialog({
    cancel: 0,
    title: 'Add a new ingredient',
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
      $.foodsection.appendItems([newitem]);
    }
  });
  dialog.show();
};

function handleExpiryAddClick(e) {
   var dialog = Ti.UI.createAlertDialog({
    cancel: 0,
    title: 'Add a new expiry type',
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
      $.expirysection.appendItems([newitem]);
    }
  });
  dialog.show();
};

function itemSelected(section, index, selected) {
  var item =  section.getItemAt(index);
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
  var item =  e.section.getItemAt(e.itemIndex);
  var wasSelected = (item.properties.accessoryType === Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK) ? true : false;
  if (true === wasSelected) {
    item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
    item.title.color = deselectedColor;
  } else {
    item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
    item.title.color = selectedColor;
  }
  e.section.updateItemAt(e.itemIndex, item);
};

function handleSwitchChange(e) {
  var isOn = (true == $.usePreferenceSwitch.value) ? true : false;
  if (isOn) {
    itemSelected($.foodsection, 0, true);
    itemSelected($.foodsection, 1, true);
    itemSelected($.foodsection, 4, true);
    itemSelected($.expirysection, 1, true);
    itemSelected($.expirysection, 3, true);
    itemSelected($.expirysection, 4, true);
    itemSelected($.expirysection, 9, true);
  } else {
    for (var i=0; i<$.foodsection.items.length; i++) {
      itemSelected($.foodsection, i, false);
    }
    for (var i=0; i<$.expirysection.items.length; i++) {
      itemSelected($.expirysection, i, false);
    }
  }
};

exports.handleClose = handleClose;

