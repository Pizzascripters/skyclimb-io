class Item {
  constructor() {
    this.id = 0;
    this.canShoot = false;         // Whether or not the gun can fire
    this.bulletDistance = 50;     // Distance between player and bullet spawn
    this.numBullets = 0;           // The number of bullets the gun fires at a time
    this.accuracy = 0;             // The error in the angle the bullets can spawn
    this.cooldownTime = 0;         // The # of frames it takes before the player can fire again
    this.shootingCooldown = this.cooldownTime;
  }
}

class Pistol extends Item {
  constructor() {
    super();
    this.id = 1;
    this.canShoot = true;
    this.bulletDistance = 40;
    this.numBullets = 1;
    this.accuracy = Math.PI / 20;
    this.cooldownTime = 10;
    this.shootingCooldown = this.cooldownTime;
  }
}

class Shotgun extends Item {
  constructor() {
    super();
    this.id = 64;
    this.canShoot = true;
    this.bulletDistance = 40;
    this.numBullets = 10;
    this.accuracy = Math.PI / 6;
    this.cooldownTime = 30;
    this.shootingCooldown = this.cooldownTime;
  }
}

// Exports is a function that inputs an id and returns an item
module.exports = function(id) {
  let item;
  switch(id) {
    case 1:
      item = new Pistol();
      break;
    case 64:
      item = new Shotgun();
      break;
    default:
      item = new Item();
      break;
  }

  for(var i in item)
    this[i] = item[i];
}
