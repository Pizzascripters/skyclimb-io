const Matter = require('./matter');

const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 60;

module.exports = function (world, p) {
  this.deleted = false;

  const radius =
    Math.sqrt(
      Math.pow(p.body.position.x - p.body.vertices[0].x, 2) +
      Math.pow(p.body.position.y - p.body.vertices[0].y, 2)
    ) + 50;
  const bulletX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  const bulletY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  const xVelocity = BULLET_SPEED * Math.cos(2 * Math.PI * p.hand / 256);
  const yVelocity = -BULLET_SPEED * Math.sin(2 * Math.PI * p.hand / 256);

  let body = this.body = Matter.Bodies.rectangle(bulletX, bulletY, 5, 5);
  Matter.Body.setVelocity(
    this.body,
    {x: xVelocity, y: yVelocity}
  );

  this.angle = p.hand;

  setTimeout(this.apoptosis = () => {
    this.deleted = true;
    Matter.Composite.remove(world, body);
  }, 5000);

  Matter.World.addBody(world, body); // Add yourself to the world
}
