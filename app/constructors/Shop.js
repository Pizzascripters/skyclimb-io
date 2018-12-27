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
    this.items.push(new Item(1));
    this.items.push(new Item(32));
    this.items.push(new Item(64));
    this.items.push(new Item(128));
    this.items.push(new Item(192));
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
