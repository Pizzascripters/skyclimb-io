var Matter = require('./Matter');

var PLAYER_START_POS = {x: 0, y: 0};
var PLAYER_RADIUS = 50;

module.exports = function(client){
  this.id = client.id;
  this.body = Matter.Bodies.circle(PLAYER_START_POS.x, PLAYER_START_POS.y, PLAYER_RADIUS);
  this.body.restitution = 0.3;
  this.client = client;
  client.player = this;

  this.keyboard = {
    left: false,
    right: false,
    jump: false
  }
  this.hand = 0;

  this.deleted = false;

  // Programmed cell suicide
  this.apoptosis = function(world){
    this.deleted = true;
    Matter.Composite.remove(world, this.body);
  }
}
