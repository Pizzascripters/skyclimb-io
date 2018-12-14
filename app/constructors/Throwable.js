const Matter = require('../lib/matter');
const Bullet = require('./Bullet');
const distance = require('../lib/distance');

// A constructor for the throwable item
module.exports = function (world, bullets, p) {
  this.deleted = false;
  this.player = p;

  const item = p.inventory.items[0];
  const angle = 2 * Math.PI * p.hand / 256;
  const radius = distance(p.body.position, p.body.vertices[0]) + item.spawnDistance;
  const throwableX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  const throwableY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  const xVelocity = item.throwSpeed * Math.cos(angle);
  const yVelocity = -item.throwSpeed * Math.sin(angle);

  let body = this.body = Matter.Bodies.circle(throwableX, throwableY, item.radius);
  Matter.Body.setVelocity(
    this.body,
    {x: xVelocity, y: yVelocity}
  );

  setTimeout(this.apoptosis = () => { // Explode
    this.deleted = true;
    for(i = 0; i < 20; i++)
      bullets.push(new Bullet(world, this, Math.PI*2));
    Matter.Composite.remove(world, body);
  }, 5000);

  Matter.World.addBody(world, body); // Add yourself to the world
}
