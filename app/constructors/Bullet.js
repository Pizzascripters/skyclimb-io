const Matter = require('../lib/matter');
const distance = require('../util/distance');

const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 40;
const BULLET_DAMAGE = 0.15;

// A constructor for the bullet
module.exports = function (world, p, accuracy = 0, type = 0, damage = BULLET_DAMAGE, speed = BULLET_SPEED, lifespan = 5000) {
  this.deleted = false;
  this.player = p;
  this.type = type;

  if(!p.hand) {
    p.hand = 0;
  }
  if(!p.getItem) {
    spawnDistance = 0;
  } else {
    spawnDistance = p.getItem().spawnDistance;
  }

  const angle =
    2 * Math.PI * p.hand / 256 +
    (Math.random() * accuracy) - accuracy / 2;
  const radius = distance(p.body.position, p.body.vertices[0]) + spawnDistance;
  const bulletX = p.body.position.x + radius * Math.cos(2 * Math.PI * p.hand / 256);
  const bulletY = p.body.position.y - radius * Math.sin(2 * Math.PI * p.hand / 256);
  const xVelocity = speed * Math.cos(angle);
  const yVelocity = -speed * Math.sin(angle);

  let body;
  if(this.type === 0 || this.type === 1) {
    body = this.body = Matter.Bodies.rectangle(bulletX, bulletY, 20, 10);
  } else if(this.type === 2) {
    body = this.body = Matter.Bodies.rectangle(bulletX, bulletY, 10, 10);
  }
  body.angle = angle;
  body.type = "bullet";
  body.bullet = this;
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

  this.hit = (p) => {
    p.health -= damage;
    if(p.health <= 0) {
      this.player.kill(p);
    }
    this.apoptosis();
  }
}
