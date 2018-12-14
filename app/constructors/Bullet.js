const Matter = require('../lib/matter');
const distance = require('../lib/distance');

const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 60;

// A constructor for the bullet
module.exports = function (world, p, accuracy) {
  this.deleted = false;
  this.player = p;

  if(!p.hand)
    p.hand = 0;
  if(!p.getItem)
    spawnDistance = 0;
  else
    spawnDistance = p.getItem().spawnDistance

  const angle =
    2 * Math.PI * p.hand / 256 +
    (Math.random() * accuracy) - accuracy / 2;
  const radius = distance(p.body.position, p.body.vertices[0]) + spawnDistance;
  const bulletX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  const bulletY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  const xVelocity = BULLET_SPEED * Math.cos(angle);
  const yVelocity = -BULLET_SPEED * Math.sin(angle);

  let body = this.body = Matter.Bodies.rectangle(bulletX, bulletY, 5, 5);
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