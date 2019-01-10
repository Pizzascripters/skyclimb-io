const Item = require('./Item');

class Shop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 400;
    this.height = 400;
    this.items = [];
  }
}

class Generic extends Shop {
  constructor(x, y) {
    super(x, y);
    this.type = 1;
    this.items.push(Item(1));
    this.items.push(Item(32));
    this.items.push(Item(64));
    this.items.push(Item(128));
    this.items.push(Item(192));
    this.items.push(Item(224));
    this.items.push(Item(225));
    this.items.push(Item(232));
    this.items.push(Item(233));
    this.items.push(Item(234));
    this.items.push(Item(235));
    this.items.push(Item(236));
    this.items.push(Item(240));
    this.items.push(Item(241));
    this.items.push(Item(242));
  }
}

module.exports = function(type, x, y) {
  let shop;
  switch(type) {
    case "generic":
      shop = new Generic(x, y);
      break;
    default:
      shop = new Shop(x, y);
      break;
  }

  for(var i in shop)
    this[i] = shop[i];
}
