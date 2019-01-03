var Matter = require('../lib/matter');
const Item = require('./Item');
const Loot = require('./Loot');
const economy = require('../systems/economy');

const PLAYER_START_POS = [
  {x: -4127, y: 4750},
  {x: -3855, y: 3710},
  {x: -3298, y: 5630},
  {x: -3142, y: 2130},
  {x: -1266, y: 2070},
  {x: 1990, y: 5230},
  {x: 567, y: 3700}
];
const PLAYER_RADIUS = 50;

module.exports = function(id, ws, world){
  this.id = id;
  this.name = "guest" + id;
  this.ws = ws;
  this.ws.player = this;

  this.choosingName = true;
  this.connected = true;
  this.alive = true;

  this.keyboard = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    throw: false,
    consume: false,
    select: false,
    loot: false
  }
  this.hand = 0;
  this.health = 1;
  this.energy = 1;
  this.kills = 0;
  this.gold = 0;
  this.score = 0;
  this.bullets = 500;
  this.shells = 200;

  this.inventory = {};
  this.inventory.select = 4;
  this.inventory.items = [];
  const itemIds = [64, 32, 1, 128, 192, 0];
  for(var i = 0; i < 7; i++)
    this.inventory.items[i] = new Item( itemIds[i] );
  this.inventory.amt = [3, 3, 0];

  this.getItem = () => {
    return this.inventory.items[this.inventory.select];
  }

  this.getAmt = () => {
    if(this.inventory.select >= 3) {
      return this.inventory.amt[this.inventory.select - 3];
    } else {
      return 1;
    }
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

  this.spawn = () => {
    const rand = Math.floor(Math.random() * PLAYER_START_POS.length)
    this.body = Matter.Bodies.circle(PLAYER_START_POS[rand].x, PLAYER_START_POS[rand].y, PLAYER_RADIUS);
    this.body.restitution = 0.3;
    this.body.radius = this.radius = PLAYER_RADIUS;
    Matter.World.addBody(world, this.body);
    this.choosingName = false;
  }

  // Player gets an item
  this.acquire = (item, number) => {
    if(!number) number = 1;

    if(item.id < 128) {
      if(number !== 1) return false;
      for(var i = 0; i < 3; i++) {
        if(this.inventory.items[i].id === 0) {
          this.inventory.items[i] = new Item(item.id);
          return true;
        }
      }
    } else if(item.id < 224) {
      for(var i = 3; i < 6; i++) {
        if(this.inventory.items[i].id === item.id) {
          this.inventory.amt[i-3] += number;
          return true;
        }
      }
      for(var i = 3; i < 6; i++) {
        if(this.inventory.items[i].id === 0) {
          this.inventory.items[i] = new Item(item.id);
          this.inventory.amt[i-3] = number;
          return true;
        }
      }
    } else {
      item.onAcquire(this, number);
      return true;
    }
    return false;
  }

  this.kill = (world, p, loot) => {
    if(!p.apoptosis(world, loot)) {
      if(p.id !== this.id) {
        this.kills++;
        economy.addGold(this, Math.round(p.gold / 2));
      }
    }
  }

  // Programmed cell suicide
  this.apoptosis = (world, loot) => {
    if(!this.alive) return 1;

    Matter.Composite.remove(world, this.body);

    for(var i in this.inventory.items) {
      const item = this.inventory.items[i];
      const amount = i>2 ? this.inventory.amt[i-3] : 1;
      if(item.id !== 0 && amount > 0)
        loot.push(new Loot(world, item.id, this.body.position, Math.random() * 2 * Math.PI, amount));
    }

    if(this.bullets > 0) {
      loot.push(new Loot(world, 224, this.body.position, Math.random() * 2 * Math.PI, this.bullets));
    }
    if(this.shells > 0) {
      loot.push(new Loot(world, 225, this.body.position, Math.random() * 2 * Math.PI, this.shells));
    }

    this.alive = false;
    return 0;
  }
}
