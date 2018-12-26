const Matter = require('../lib/matter');
const distance = require('../lib/distance');

const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 40;
const BULLET_DAMAGE = 0.15;

// A constructor for the bullet
module.exports = function (world, p, accuracy, speed, lifespan, damage) {
  if(!accuracy) accuracy = 0; // Counterintuitively, 0 accuracy means no deviation
  if(!speed) speed = BULLET_SPEED;
  if(!lifespan) lifespan = 5000;
  if(!damage) damage = BULLET_DAMAGE;

  this.deleted = false;
  this.player = p;
  this.type = 0;

  if(!p.hand) {
    p.hand = 0;
  }
  if(!p.getItem) {
    spawnDistance = 0;
  } else {
    spawnDistance = p.getItem().spawnDistance
  }

  const angle =
    2 * Math.PI * p.hand / 256 +
    (Math.random() * accuracy) - accuracy / 2;
  const radius = distance(p.body.position, p.body.vertices[0]) + spawnDistance;
  const bulletX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  const bulletY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  const xVelocity = speed * Math.cos(angle);
  const yVelocity = -speed * Math.sin(angle);

  let body = this.body = Matter.Bodies.rectangle(bulletX, bulletY, 5, 5);
  Matter.Body.setVelocity(
    this.body,
    {x: xVelocity, y: yVelocity}
  );

  this.angle = Math.floor(256 * angle / (2 * Math.PI));
  this.xv = xVelocity;
  this.yv = yVelocity;

  setTimeout(this.apoptosis = () => {
    this.deleted = true;
    Matter.Composite.remove(world, body);
  }, lifespan);

  Matter.World.addBody(world, body); // Add yourself to the world

  this.hit = p => {
    p.health -= damage;
    if(p.health <= 0) {
      if(this.player.kill) {
        this.player.kill(world, p);
      } else { // It's a nade kill
        this.player.player.kill(world, p);
      }
    }
    this.apoptosis();
  }
}
