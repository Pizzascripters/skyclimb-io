const Item = require('./Item');

function Shop(x, y) {
  var shop = {};
  shop.x = x;
  shop.y = y;
  shop.width = 400;
  shop.height = 400;
  shop.itemIds = [];
  shop.items = [];

  shop.buy = (p, slot, amt) => {
    Item(shop.itemIds[slot]).buy(p, amt);
  }

  return shop;
}

function Generic(x, y) {
  var shop = Shop(x, y);
  shop.type = 1;

  shop.itemIds.push(224);
  shop.itemIds.push(225);
  shop.itemIds.push(128);
  shop.itemIds.push(192);

  shop.itemIds.push(232);
  shop.itemIds.push(233);
  shop.itemIds.push(234);
  shop.itemIds.push(235);

  shop.itemIds.push(1);
  shop.itemIds.push(32);
  shop.itemIds.push(240);

  for(var i in shop.itemIds) {
    shop.items.push(Item(shop.itemIds[i]));
  }

  return shop;
}

function Golden(x, y) {
  var shop = Shop(x, y);
  shop.type = 2;

  shop.itemIds.push(224);
  shop.itemIds.push(225);
  shop.itemIds.push(128);
  shop.itemIds.push(192);

  shop.itemIds.push(16);
  shop.itemIds.push(64);
  shop.itemIds.push(241);
  shop.itemIds.push(242);

  shop.itemIds.push(243);
  shop.itemIds.push(236);

  for(var i in shop.itemIds) {
    shop.items.push(Item(shop.itemIds[i]));
  }

  return shop;
}

module.exports = (type, x, y) => {
  var shop;
  switch(type) {
    case "generic":
      shop = Generic(x, y);
      break;
    case "golden":
      shop = Golden(x, y);
      break;
    default:
      shop = Shop(x, y);
      break;
  }

  return shop;
}
