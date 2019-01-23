var Matter = require('../lib/matter');
const Item = require('./Item');
const Loot = require('./Loot');
const economy = require('../systems/economy');
const io = require('../systems/io');

const PLAYER_START_POS = [
  {x: -14963, y: 10600},
  {x: -13400, y: 10900},
  {x: -11984, y: 11000},
  {x: -10994, y: 10300},
  {x: -10560, y: 10300},
  {x: -9957, y: 9600},
  {x: -10818, y: 8800},
  {x: -10323, y: 8000},
  {x: -9680, y: 8000},
  {x: -7473, y: 8400},
  {x: -9096, y: 6900},
  {x: -8394, y: 6800},
  {x: 14135, y: 10900},
  {x: 10587, y: 7500},
  {x: 12885, y: 7900},
  {x: 12100, y: 8100},
  {x: 11785, y: 8400},
  {x: 11850, y: 9100},
  {x: 12012, y: 10100},
  {x: 12372, y: 10200},
  {x: 12725, y: 10400},
  {x: 14135, y: 10900}
];
//const PLAYER_START_POS = [{x: 0, y: 0}];
const PLAYER_RADIUS = 50;

module.exports = function(id, ws, world, loot, SHIELD_MILLIS){
  this.id = id;
  this.name = "guest" + id;
  this.ws = ws;
  this.ws.player = this;
  this.lastVisible = []; // The ids of the players that were visible last packet

  // Player states
  this.choosingName = true;
  this.connected = true;
  this.alive = true;

  // Virtual Keyboard
  this.keyboard = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    throw: false,
    consume: false,
    select: false,
    loot: false,
    reload: false
  }

  this.hand = 0; // The angle (number 0-255) that the player is holding their weapon
  this.health = 1;
  this.shield = 0;
  this.energy = 1;
  this.kills = 0;
  this.gold = 0;
  this.score = 0;
  this.bullets = 500;
  this.shells = 200;

  this.healing = false;
  this.amountToHeal = 0;
  this.healPerTick = 0;
  this.reloadProgress = 0;

  this.inventory = {};
  this.inventory.select = 4;
  this.inventory.items = [];
  const itemIds = [64, 32, 1, 128, 192, 0];
  for(var i = 0; i < 6; i++)
    this.inventory.items[i] = Item(itemIds[i]);
  this.inventory.amt = [1, 1, 1, 3, 3, 0];

  this.jetpack = Item(240);
  this.scope = Item(232);

  // Returns the distance the player can see with their current scope
  this.getVisibility = () => {
    return this.scope.visibility;
  }

  // Converts hand to radians
  this.handRadians = () => {
    return 2 * Math.PI * this.hand / 256;
  }

  this.getItem = () => {
    return this.inventory.items[this.inventory.select];
  }

  this.getAmt = () => {
    return this.inventory.amt[this.inventory.select];
  }

  this.inGame = () => {
    return !this.choosingName && this.alive;
  }

  this.isPlaying = () => {
    return !this.choosingName && this.connected && this.alive;
  }

  this.isSpectating = () => {
    return !this.choosingName && this.connected && !this.alive;
  }

  this.isDeleted = () => {
    return !this.choosingName && !this.connected && !this.alive;
  }

  this.inSafezone = (map) => {
    for(var i in map.objects) {
      if(map.objectTypes[i] === "safezone") {
        if(Matter.SAT.collides(this.body, map.szBodies[i]).collided) {
          return true;
        }
      }
    }
    return false;
  }

  this.replenishShield = () => {
    this.shield = SHIELD_MILLIS;
  }

  this.shieldOn = () => {
    return this.shield > 0;
  }

  this.spawn = () => {
    const rand = Math.floor(Math.random() * PLAYER_START_POS.length)
    this.body = Matter.Bodies.circle(PLAYER_START_POS[rand].x, PLAYER_START_POS[rand].y, PLAYER_RADIUS);
    this.body.type = "player";
    this.body.player = this;
    this.body.restitution = 0.3;
    this.body.radius = this.radius = PLAYER_RADIUS;
    this.body.collisionFilter.category = 1;
    this.body.collisionFilter.mask = 1;
    Matter.World.addBody(world, this.body);
    this.choosingName = false;
  }

  // Player gets an item
  this.acquire = (item, number) => {
    if(!number) number = 1;

    if(item.id < 128) { // Weapon
      if(number !== 1) return false;
      for(var i = 0; i < 3; i++) {
        if(this.inventory.items[i].id === 0) {
          this.inventory.items[i] = item;
          return true;
        }
      }
    } else if(item.id < 224) { // Medkits, Nades, etc.
      for(var i = 3; i < 6; i++) {
        if(this.inventory.items[i].id === item.id) {
          this.inventory.amt[i] += number;
          if(this.inventory.amt[i] > 255) { // Cap items
            this.drop(Item(this.inventory.items[i].id), false, this.inventory.amt[i] - 255);
            this.inventory.amt[i] = 255;
          }
          return true;
        }
      }
      for(var i = 3; i < 6; i++) {
        if(this.inventory.items[i].id === 0) {
          this.inventory.items[i] = item;
          this.inventory.amt[i] = number;
          return true;
        }
      }
    } else { // Jetpacks
      item.onAcquire(this, number);
      return true;
    }
    return false;
  }

  // Called when we kill a player
  this.kill = (p) => {
    if(p.apoptosis()) {
      if(p.id !== this.id) {
        this.kills++;
        economy.addGold(this, Math.round(p.gold / 2));
      }
    }
  }

  this.drop = (item, randomAngle=false, amt=1) => {
    if(randomAngle) {
      loot.push(new Loot(world, item, this.body.position, Math.random() * 2 * Math.PI, amt));
    } else {
      loot.push(new Loot(world, item, this.body.position, this.handRadians(), amt));
    }
  }

  this.dropJetpack = () => {
    this.drop(this.jetpack);
  }

  this.dropScope = () => {
    this.drop(this.scope);
  }

  // Programmed cell suicide
  this.apoptosis = () => {
    if(!this.alive) return false;

    // Deleting the object like this because Matter.Composite.remove wasn't working...
    for(var i in world.bodies){
      if(world.bodies[i].id === this.body.id) {
        world.bodies.splice(i, 1);
      }
    }

    // Drop all items
    for(var i in this.inventory.items) {
      const item = this.inventory.items[i];
      const amount = i>2 ? this.inventory.amt[i] : 1;
      if(item.id !== 0 && amount > 0)
        this.drop(item, true, amount);
    }

    if(this.bullets > 0) {
      this.drop(Item(224), true, this.bullets);
    }
    if(this.shells > 0) {
      this.drop(Item(225), true, this.shells);
    }
    this.drop(this.jetpack, true);
    this.drop(this.scope, true);

    this.alive = false;
    return true;
  }
}
