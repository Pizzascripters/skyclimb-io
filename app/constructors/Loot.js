const Matter = require('../lib/matter');
const Item = require('./Item');

const LOOT_RADIUS = 50;
const LOOT_LIFESPAN = 30000;
const LOOT_SPAWNSPEED = 10;

module.exports = function(world, item, pos, angle=Math.random()*2*Math.PI, amount=1) {
  this.item = item;
  this.radius = LOOT_RADIUS;
  this.amount = amount;

  const xVelocity = LOOT_SPAWNSPEED * Math.cos(angle);
  const yVelocity = -LOOT_SPAWNSPEED * Math.sin(angle);

  let body = this.body = Matter.Bodies.circle(pos.x, pos.y, LOOT_RADIUS);
  body.collisionFilter.group = 2;
  body.collisionFilter.mask = 2;
  Matter.World.addBody(world, body); // Add yourself to the world
  Matter.Body.setVelocity(
    this.body,
    {x: xVelocity, y: yVelocity}
  );

  setTimeout(this.apoptosis = () => {
    this.deleted = true;
    Matter.Composite.remove(world, body);
  }, LOOT_LIFESPAN);
}
