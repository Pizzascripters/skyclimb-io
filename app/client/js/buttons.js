function createButtons(Game) {
  const inventory = Game.inventory;

  var buttons = {};

  // Inventory buttons
  buttons.inventory = [];
  var xPositions = [-340, -220, -100, 100, 220, 340];
  for(var i = 0; i < xPositions.length; i++) {
    var button = new Button(Game, cvs.width / 2 + xPositions[i], -10, 100, INVENTORY_COLLAPSED_HEIGHT, {"type": "inventory", "id": i});
    buttons.inventory.push(button);
  }

  // Close button
  buttons.shopMenu = {};
  const width = cvs.width / 2;
  const height = 9 * width / 16;
  buttons.shopMenu.close = new Button(Game, (cvs.width - width) / 2, (cvs.height - height) / 2, 50, 50, {"type": "closeShop"});
  buttons.shopMenu.close.image = Game.images.shops.close;

  return buttons;
}

function Button(Game, x, y, width, height, args) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.enabled = true;

  this.rect = () => {
    return {x, y, width, height};
  }

  this.hovering = () => {
    var rect = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
    if(insideRect(mouse, rect) && this.enabled) {
      return true;
    }
  }

  this.update = () => {
    if(this.hovering()) {
      cvs.style.cursor = "pointer";
    }
  }

  this.click = () => {
    if(args.type === "inventory") {
      Game.inventory.select = args.id;
    } else if(args.type === "closeShop") {
      Game.shopMenu = [];
    }
  }
}
