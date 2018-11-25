var PLAYER_START_POS = {x: 0, y: 0};
var PLAYER_RADIUS = 50;

module.exports = function(Matter, client){
  this.id = client.id;
  this.body = Matter.Bodies.circle(PLAYER_START_POS.x, PLAYER_START_POS.y, PLAYER_RADIUS);
  this.client = client;
  client.player = this;

  this.keyboard = {
    left: false,
    right: false,
    jump: false
  }

  this.deleted = false;
}
