class Item {
  constructor() {
    this.type = "empty";
    this.name = "Empty";
    this.plural = "Empties";
    this.id = 0;
    this.canShoot = false;         // Whether or not the item can fire
    this.shotgun = false;          // Whether or not this gun is a shotgun
    this.throwable = false;        // Whether or not the item can be thrown
    this.consumable = false;       // Whether or not the item can be consumed
    this.spawnDistance = 50;       // Distance between player and bullet spawn
    this.numBullets = 0;           // The number of bullets the gun fires at a time
    this.accuracy = 0;             // The error in the angle the bullets can spawn
    this.cooldownTime = 0;         // The # of frames it takes before the player can fire again
    this.shootingCooldown = this.cooldownTime;

    this.buy = p => {
      if(this.price){
        if(p.gold >= this.price) {
          if(p.acquire(this)) {
            p.gold -= this.price;
          }
        }
      }
    }
  }
}

class Pistol extends Item {
  constructor() {
    super();
    this.type = "weapon";
    this.name = "Glock";
    this.plural = "Glocks";
    this.id = 1;
    this.price = 50;
    this.canShoot = true;
    this.spawnDistance = 40;
    this.numBullets = 1;
    this.accuracy = Math.PI / 30;
    this.cooldownTime = 5;
    this.shootingCooldown = this.cooldownTime;
  }
}

class Ak47 extends Item {
  constructor() {
    super();
    this.type = "weapon";
    this.name = "Ak47";
    this.plural = "Ak47s";
    this.id = 32;
    this.price = 150;
    this.canShoot = true;
    this.spawnDistance = 50;
    this.numBullets = 1;
    this.accuracy = Math.PI / 20;
    this.cooldownTime = 3;
    this.shootingCooldown = this.cooldownTime;
  }
}

class Shotgun extends Item {
  constructor() {
    super();
    this.type = "weapon";
    this.name = "Pump";
    this.plural = "Pumps";
    this.id = 64;
    this.price = 300;
    this.canShoot = true;
    this.shotgun = true;
    this.spawnDistance = 40;
    this.numBullets = 10;
    this.accuracy = Math.PI / 6;
    this.cooldownTime = 20;
    this.shootingCooldown = this.cooldownTime;
  }
}

class Nade extends Item {
  constructor() {
    super();
    this.type = "throwable";
    this.name = "Nade";
    this.plural = "Nades";
    this.id = 128;
    this.price = 20;
    this.throwable = true;
    this.throwSpeed = 20;
    this.spawnDistance = 60;
    this.radius = 10;
    this.cooldownTime = 20;
    this.shootingCooldown = 0;
  }
}

class Bandage extends Item {
  constructor() {
    super();
    this.type = "consumable";
    this.name = "Bandage";
    this.plural = "Bandages";
    this.id = 192;
    this.price = 50;
    this.consumable = true;
    this.cooldownTime = 20;
    this.shootingCooldown = 0;

    this.canConsume = p => {
      if(p.health < 1)
        return true;
      return false;
    }

    this.consume = p => {
      p.health += 0.3;
      if(p.health > 1)
        p.health = 1;
    }
  }
}

// Exports is a function that inputs an id and returns an item
module.exports = function(id) {
  let item;
  switch(id) {
    case 1:
    case "glock":
      item = new Pistol();
      break;
    case 32:
    case "ak47":
      item = new Ak47();
      break;
    case 64:
    case "pump":
      item = new Shotgun();
      break;
    case 128:
    case "nade":
      item = new Nade();
      break;
    case 192:
    case "bandage":
      item = new Bandage();
      break;
    default:
    case "item":
      item = new Item();
      break;
  }

  for(var i in item)
    this[i] = item[i];
}
