function Item(id, name, image, w, h, radialShift) {
  this.id = id;
  this.name = name;
  this.width = 50;
  this.height = 50;
  this.radialShift = 0;

  if(w)
    this.width = w;
  if(h)
    this.height = h;
  if(radialShift)
    this.radialShift = radialShift;

  if(image)
    this.image = image;
  else
    this.image = null;
}

function initItems(items, images) {
  items[0] = new Item(0, "Empty")
  items[1] = new Item(1, "Pistol", images.pistol);
  items[64] = new Item(64, "Shotgun", images.shotgun, 100, 50, -50);
}
