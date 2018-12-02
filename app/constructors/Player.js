var Matter = require('../lib/matter');

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
  this.shooting_cooldown = 0; // Number of frames until player can shoot again

  const rand = Math.floor(Math.random() * PLAYER_START_POS.length)

  this.body = Matter.Bodies.circle(PLAYER_START_POS[rand].x, PLAYER_START_POS[rand].y, PLAYER_RADIUS);
  this.body.restitution = 0.3;

  this.keyboard = {
    left: false,
    right: false,
    jump: false
  }
  this.inventory = {
    select: 5,
    items: [0, 0, 0, 64, 0, 1, 0, 0, 0]
  }
  this.hand = 0;
  this.health = 1;
  this.energy = 1;
  this.gold = 0;
  this.kills = 0;

  this.deleted = false;

  // Programmed cell suicide
  this.apoptosis = function(world){
    this.deleted = true;
    Matter.Composite.remove(world, this.body);
  }

  this.getItem = function(){
    return this.inventory.items[this.inventory.select];
  }
}
