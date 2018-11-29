const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 5;
const BULLET_SPEED = 30;

module.exports = function (Matter, world, p) {
  this.deleted = false;

  var radius = Math.sqrt(Math.pow(p.body.position.x - p.body.vertices[0].x, 2) + Math.pow(p.body.position.y - p.body.vertices[0].y, 2)) + 50;
  var bulletX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  var bulletY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  var xVelocity = BULLET_SPEED * Math.cos(2 * Math.PI * p.hand / 256);
  var yVelocity = -BULLET_SPEED * Math.sin(2 * Math.PI * p.hand / 256);

  var body = this.body = Matter.Bodies.rectangle(bulletX, bulletY, 5, 5);
  Matter.Body.setVelocity(this.body, {x: xVelocity, y: yVelocity});

  setTimeout(this.apoptosis = () => {
    this.deleted = true;
    Matter.Composite.remove(world, body);
  }, 5000);
}
