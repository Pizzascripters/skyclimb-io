function Item(id, name, imageObj, w, h, radialShift) {
  this.id = id;
  this.name = name;
  this.width = 50;
  this.height = 50;
  this.radialShift = 0;

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
  } else if(h) {
    this.height = h;
  }
  if(radialShift) {
    this.radialShift = radialShift;
  }
}

function initItems(items, images) {
  items[0] = new Item(0, "Empty")
  items[1] = new Item(1, "Glock", images.weapons.glock);
  items[32] = new Item(32, "Ak47", images.weapons.ak47, 100, 50, -50);
  items[64] = new Item(64, "Pump", images.weapons.pump, 100, 50, -50);
  items[128] = new Item(128, "Nade", images.items.nade, 20, 20);
  items[192] = new Item(192, "Bandage", images.items.bandage, 20, 20);
}
