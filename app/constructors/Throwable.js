const Matter = require('../lib/matter');
const distance = require('../lib/distance');

// A constructor for the throwable item
module.exports = function (world, p) {
  this.deleted = false;
  this.player = p;

  const item = p.inventory.items[0];
  const angle = 2 * Math.PI * p.hand / 256;
  const radius = distance(p.body.position, p.body.vertices[0]) + item.spawnDistance;
  const throwableX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  const throwableY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  const xVelocity = item.throwSpeed * Math.cos(angle);
  const yVelocity = -item.throwSpeed * Math.sin(angle);

  let body = this.body = Matter.Bodies.rectangle(throwableX, throwableY, item.width, item.height);
  Matter.Body.setVelocity(
    this.body,
    {x: xVelocity, y: yVelocity}
  );

  this.angle = Math.floor(256 * angle / (2 * Math.PI));

  setTimeout(this.apoptosis = () => {
    this.deleted = true;
    Matter.Composite.remove(world, body);
  }, 5000);

  Matter.World.addBody(world, body); // Add yourself to the world
}
