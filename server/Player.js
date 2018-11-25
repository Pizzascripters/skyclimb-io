module.exports = function(Matter, client){
  this.id = client.id;
  this.body = Matter.Bodies.circle(1000, 100, 50);
  this.client = client;
  client.player = this;

  this.keyboard = {
    left: false,
    right: false,
    jump: false
  }

  this.deleted = false;
}
