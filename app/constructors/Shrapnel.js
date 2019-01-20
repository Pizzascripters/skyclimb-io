const Bullet = require('./Bullet');

const SHRAPNEL_SPEED = 60;

class Shrapnel extends Bullet {
  constructor(world, p, accuracy) {
    super(world, p, accuracy, 1, 0.5, SHRAPNEL_SPEED, 1000);
  }
}

module.exports = Shrapnel;
