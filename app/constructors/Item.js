const constants = {};
require('../constants')(constants);

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
  item.damage = 0.15;            // The damage of the bullet
  this.speed = 40;               // The speed at which the bullet shoots
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
  item.cooldownTime = 12;
  item.shootingCooldown = item.cooldownTime;
}
function Sniper(item) {
  Item(item);
  item.type = "weapon";
  item.name = "Sniper";
  item.plural = "Snipers";
  item.id = 16;
  item.price = 250;
  item.canShoot = true;
  item.spawnDistance = 50;
  item.numBullets = 1;
  item.magazineSize = 5;
  item.magazineSize = 4;
  item.reloadTime = 2000;
  item.accuracy = 0;
  item.damage = 0.6;
  item.speed = 80;
  item.cooldownTime = 100;
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
  item.damage = 0.25;
  item.speed = 50;
  item.cooldownTime = 6;
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
  item.damage = 0.1;
  item.speed = 40;
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
    if(p.bullets > constants.BULLET_CAP) { // Cap bullets
      p.drop(module.exports(224), false, p.bullets - constants.BULLET_CAP)
      p.bullets = constants.BULLET_CAP;
    }
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
    if(p.shells > constants.SHELL_CAP) { // Cap bullets
      p.drop(module.exports(225), false, p.shells - constants.SHELL_CAP)
      p.shells = constants.SHELL_CAP;
    }
  }
  return item;
}

function Scope(item) {
  Item(item);
  item.type = "scope";
  item.name = "Scope";
  item.plurals = "Scopes";
  this.visibility = 1000;

  item.onAcquire = (p, amount) => {
    p.dropScope();
    p.scope = item;
  }
}

function ScopeLvl1(item) {
  Scope(item);
  item.name = "ScopeLvl1";
  item.plural = "ScopeLvl1s";
  item.id = 232;
  item.price = 20;
  item.visibility = 1000;
}

function ScopeLvl2(item) {
  Scope(item);
  item.name = "ScopeLvl3";
  item.plural = "ScopeLvl3s";
  item.id = 233;
  item.price = 50;
  item.visibility = 1500;
}

function ScopeLvl3(item) {
  Scope(item);
  item.name = "ScopeLvl3";
  item.plural = "ScopeLvl3s";
  item.id = 234;
  item.price = 100;
  item.visibility = 2000;
}

function ScopeLvl4(item) {
  Scope(item);
  item.name = "ScopeLvl4";
  item.plural = "ScopeLvl4s";
  item.id = 235;
  item.price = 200;
  item.visibility = 3000;
}

function ScopeLvl5(item) {
  Scope(item);
  item.name = "ScopeLvl5";
  item.plural = "ScopeLvl5s";
  item.id = 236;
  item.price = 300;
  item.visibility = 4000;
}

function Jetpack(item) {
  Item(item);
  item.type = "jetpack";
  item.jetpackId = 0;

  item.onAcquire = (p, amount) => {
    p.dropJetpack();
    p.jetpack = item;
  }
}

function StandardJetpack(item) {
  Jetpack(item);
  item.type = "jetpack";
  item.name = "StandardJetpack";
  item.plural = "StandardJetpacks";
  item.id = 240;
  item.jetpackId = 1;
  item.price = 100;

  item.power = 0.03;
  item.battery = 4;
  item.recharge = 0.012;
}

function LightningJetpack(item) {
  Jetpack(item);
  item.type = "jetpack";
  item.name = "LightningJetpack";
  item.plural = "LightningJetpacks";
  item.id = 241;
  item.jetpackId = 2;
  item.price = 250;

  item.power = 0.045;
  item.battery = 4.5;
  item.recharge = 0.016;
}

function BullJetpack(item) {
  Jetpack(item);
  item.type = "jetpack";
  item.name = "BullJetpack";
  item.plural = "BullJetpacks";
  item.id = 242;
  item.jetpackId = 3;
  item.price = 300;

  item.power = 0.028;
  item.battery = 4.75;
  item.recharge = 0.019;
}

function LaserJetpack(item) {
  Jetpack(item);
  item.type = "jetpack";
  item.name = "LaserJetpack";
  item.plural = "LaserJetpacks";
  item.id = 243;
  item.jetpackId = 4;
  item.price = 2000;

  item.power = 0.05;
  item.battery = 7;
  item.recharge = 0.02;
}

// Exports is a function that inputs an id and returns an item
module.exports = function(id) {
  let item = {};
  switch(id) {
    case 1:
    case "glock":
      Pistol(item);
      break;
    case 16:
    case "sniper":
      Sniper(item);
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
    case 232:
      ScopeLvl1(item);
      break;
    case 233:
      ScopeLvl2(item);
      break;
    case 234:
      ScopeLvl3(item);
      break;
    case 235:
      ScopeLvl4(item);
      break;
    case 236:
      ScopeLvl5(item);
      break;
    case 240:
      StandardJetpack(item);
      break;
    case 241:
      LightningJetpack(item);
      break;
    case 242:
      BullJetpack(item);
      break;
    case 243:
      LaserJetpack(item);
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
