const Matter = require('../lib/matter');
const Item = require('./Item');

const LOOT_RADIUS = 30;
const LOOT_LIFESPAN = 30000;

module.exports = function(world, itemId, pos) {
  this.item = new Item(itemId);
  this.radius = LOOT_RADIUS;

  let body = this.body = Matter.Bodies.circle(pos.x, pos.y, LOOT_RADIUS);
  body.collisionFilter.group = 1;
  body.collisionFilter.mask = 0;
  Matter.World.addBody(world, body); // Add yourself to the world

  setTimeout(this.apoptosis = () => {
    this.deleted = true;
    Matter.Composite.remove(world, body);
  }, LOOT_LIFESPAN);
}
