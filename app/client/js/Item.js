function Item(id, name, imageObj, w, h, radialShift, shotgun) {
  this.id = id;
  this.name = name;
  this.width = 50;
  this.height = 50;
  this.radialShift = 0;
  this.shotgun = false;
  this.canBuy10 = false;
  this.canBuy100 = false;

  if(imageObj) {
    if(imageObj.l) {
      this.image = this.l = imageObj.l;
      this.ul = imageObj.ul;
      this.fire = imageObj.fire;
    } else {
      this.image = imageObj;
    }
  } else {
    this.image = null;
  }

  if(w) {
    this.width = w;
  }
  if(h) {
    this.height = h;
  }
  if(radialShift) {
    this.radialShift = radialShift;
  }
  if(shotgun) {
    this.shotgun = shotgun;
  }
}

function initItems(items, images) {
  items[0] = new Item(0, "Empty");
  items[1] = new Item(1, "Glock", images.weapons.glock);
  items[16] = new Item(16, "Sniper", images.weapons.sniper, 100, 50, -50);
  items[32] = new Item(32, "Ak47", images.weapons.ak47, 100, 50, -50);
  items[64] = new Item(64, "Pump", images.weapons.pump, 100, 50, -50, true);

  items[128] = new Item(128, "Nade", images.items.nade, 40, 40);
  items[128].canBuy10 = items[128].canBuy100 = true;

  items[192] = new Item(192, "Bandage", images.items.bandage, 40, 40);
  items[192].canBuy10 = items[192].canBuy100 = true;

  items[224] = new Item(224, "Bullet", images.stats.bullets, 30, 30);
  items[224].canBuy10 = items[224].canBuy100 = true;

  items[225] = new Item(225, "Shell", images.stats.shells, 30, 30);
  items[225].canBuy10 = items[225].canBuy100 = true;

  items[232] = new Item(232, "Lvl 1 Scope", images.scopes[1], 30, 30);
  items[233] = new Item(233, "Lvl 2 Scope", images.scopes[2], 30, 30);
  items[234] = new Item(234, "Lvl 3 Scope", images.scopes[3], 30, 30);
  items[235] = new Item(235, "Lvl 4 Scope", images.scopes[4], 30, 30);
  items[236] = new Item(236, "Lvl 5 Scope", images.scopes[5], 30, 30);
  items[240] = new Item(240, "Standard Jetpack", images.jetpacks.standard);
  items[241] = new Item(241, "Lightning Jetpack", images.jetpacks.lightning);
  items[242] = new Item(242, "Bull Jetpack", images.jetpacks.bull);
  items[243] = new Item(243, "Laser Jetpack", images.jetpacks.laser);

  items[232].level = 1;
  items[233].level = 2;
  items[234].level = 3;
  items[235].level = 4;
  items[236].level = 5;
}
