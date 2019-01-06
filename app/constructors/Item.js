function Item(item) {
  item.type = "empty";
  item.name = "Empty";
  item.plural = "Empties";
  item.id = 0;
  item.canShoot = false;         // Whether or not the item can fire
  item.shotgun = false;          // Whether or not item gun is a shotgun
  item.throwable = false;        // Whether or not the item can be thrown
  item.consumable = false;       // Whether or not the item can be consumed
  item.spawnDistance = 50;       // Distance between player and bullet spawn
  item.numBullets = 0;           // The number of bullets the gun fires at a time
  item.magazineSize = 0;         // The maximum number of bullets in the magazine
  item.magazine = 0;             // The current number of bullets in the magazine
  item.reloadTime = 2000;        // The millis is takes the weapon to reload
  item.accuracy = 0;             // The error in the angle the bullets can spawn
  item.cooldownTime = 0;         // The # of frames it takes before the player can fire again
  item.shootingCooldown = item.cooldownTime;

  item.buy = (p, amount) => {
    if(item.price){
      if(p.gold >= item.price * amount) {
        if(p.acquire(item, amount)) {
          p.gold -= item.price * amount;
        }
      }
    }
  }

  item.reloading = false;
  item.reload = (p) => {
    if(!item.canShoot) return false;
    var ammo = item.shotgun ? p.shells : p.bullets;
    if(ammo + item.magazine > item.magazineSize) {
      if(item.shotgun) {
        p.shells -= item.magazineSize - item.magazine;
      } else {
        p.bullets -= item.magazineSize - item.magazine;
      }
      item.magazine = item.magazineSize;
      return true;
    } else if(ammo > 0) {
      if(item.shotgun) {
        p.shells = 0;
      } else {
        p.bullets = 0;
      }
      item.magazine += ammo;
      return true;
    } else {
      return false;
    }
  }

  return item;
}

function Pistol(item){
  Item(item);
  item.type = "weapon";
  item.name = "Glock";
  item.plural = "Glocks";
  item.id = 1;
  item.price = 50;
  item.canShoot = true;
  item.spawnDistance = 40;
  item.numBullets = 1;
  item.magazineSize = 15;
  item.accuracy = Math.PI / 30;
  item.cooldownTime = 5;
  item.shootingCooldown = item.cooldownTime;
}

function Ak47(item) {
  Item(item);
  item.type = "weapon";
  item.name = "Ak47";
  item.plural = "Ak47s";
  item.id = 32;
  item.price = 150;
  item.canShoot = true;
  item.spawnDistance = 50;
  item.numBullets = 1;
  item.magazineSize = 30;
  item.reloadTime = 3000;
  item.accuracy = Math.PI / 20;
  item.cooldownTime = 3;
  item.shootingCooldown = item.cooldownTime;
}

function Shotgun(item) {
  Item(item);
  item.type = "weapon";
  item.name = "Pump";
  item.plural = "Pumps";
  item.id = 64;
  item.price = 300;
  item.canShoot = true;
  item.shotgun = true;
  item.spawnDistance = 40;
  item.numBullets = 10;
  item.magazineSize = 4;
  item.reloadTime = 500;
  item.accuracy = Math.PI / 6;
  item.cooldownTime = 20;
  item.shootingCooldown = item.cooldownTime;

  item.reload = (p) => {
    if(p.shells > 0) {
      p.shells--;
      item.magazine++;
      if(item.magazine !== item.magazineSize && p.shells > 0) {
        item.reloading = true;
      }
      return true;
    } else {
      return false;
    }
  }
}

function Nade(item) {
  Item(item);
  item.type = "throwable";
  item.name = "Nade";
  item.plural = "Nades";
  item.id = 128;
  item.price = 20;
  item.throwable = true;
  item.throwSpeed = 20;
  item.spawnDistance = 60;
  item.radius = 21;
  item.cooldownTime = 20;
  item.shootingCooldown = 0;
}

function Bandage(item) {
  Item(item);
  item.type = "consumable";
  item.name = "Bandage";
  item.plural = "Bandages";
  item.id = 192;
  item.price = 50;
  item.consumable = true;
  item.cooldownTime = 20;
  item.shootingCooldown = 0;

  item.canConsume = p => {
    if(p.health < 1 && p.healing === false)
      return true;
    return false;
  }

  item.consume = p => {
    p.healing = true;
    p.amountToHeal += 0.3;
    p.healPerTick += 0.002;
  }
}

function Bullet(item) {
  Item(item);
  item.type = "bullet";
  item.name = "Bullet";
  item.plural = "Bullets";
  item.id = 224;
  item.price = 1;

  item.onAcquire = (p, amount) => {
    p.bullets += amount;
  }
}

function Shell(item) {
  Item(item);
  item.type = "bullet";
  item.name = "Shell";
  item.plural = "Shells";
  item.id = 225;
  item.price = 8;

  item.onAcquire = (p, amount) => {
    p.shells += amount;
  }
  return item;
}

// Exports is a function that inputs an id and returns an item
module.exports = function(id) {
  let item = {};
  switch(id) {
    case 1:
    case "glock":
      Pistol(item);
      break;
    case 32:
    case "ak47":
      Ak47(item);
      break;
    case 64:
    case "pump":
      Shotgun(item);
      break;
    case 128:
    case "nade":
      Nade(item);
      break;
    case 192:
    case "bandage":
      Bandage(item);
      break;
    case 224:
    case "bullet":
      Bullet(item);
      break;
    case 225:
    case "shell":
      Shell(item);
      break;
    case 0:
    case "empty":
    case "item":
    default:
      item = Item(item);
      break;
  }
  item.magazine = item.magazineSize;
  return item;
}
