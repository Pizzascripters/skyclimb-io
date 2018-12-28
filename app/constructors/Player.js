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

module.exports = function(ws, id){
  this.ws = ws;
  this.id = id;
  this.disconnected = false;

  const rand = Math.floor(Math.random() * PLAYER_START_POS.length)

  this.body = Matter.Bodies.circle(PLAYER_START_POS[rand].x, PLAYER_START_POS[rand].y, PLAYER_RADIUS);
  this.body.restitution = 0.3;
  this.radius = PLAYER_RADIUS;

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

  this.inventory = {};
  this.inventory.select = 4;
  this.inventory.items = [];
  const itemIds = [64, 32, 1, 128, 192, 0];
  for(var i = 0; i < 7; i++)
    this.inventory.items[i] = new Item( itemIds[i] );
  this.inventory.amt = [3, 3, 0];

  this.deleted = false;

  // Player gets an item
  this.acquire = (item, number) => {
    if(!number) number = 1;

    if(item.id < 128) {
      for(var i = 0; i < 3; i++) {
        if(this.inventory.items[i].id === 0) {
          this.inventory.items[i] = new Item(item.id);
          return true;
        }
      }
    } else {
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
    }
    return false;
  }

  this.kill = (world, p, loot) => {
    this.kills++;
    economy.addGold(this, Math.round(p.gold / 2));
    p.apoptosis(world, loot);
  }

  // Programmed cell suicide
  this.apoptosis = (world, loot) => {
    this.deleted = true;
    Matter.Composite.remove(world, this.body);

    for(var i in this.inventory.items) {
      const item = this.inventory.items[i];
      const amount = this.inventory.amt[i] !== undefined ? this.inventory.amt[i] : 1;
      if(item.id !== 0 && amount > 0)
        loot.push(new Loot(world, item.id, this.body.position, Math.random() * 2 * Math.PI, amount));
    }
  }

  this.getItem = () => {
    return this.inventory.items[this.inventory.select];
  }
}
