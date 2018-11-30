function Item(id, name, image) {
  this.id = id;
  this.name = name;

  if(image)
    this.image = image;
  else
    this.image = null;
}

function initItems() {
  items[0] = new Item(0, "Empty")
  items[1] = new Item(1, "Pistol", images.pistol);
}
