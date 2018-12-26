const Bullet = require('./Bullet');

const SHRAPNEL_SPEED = 60;

class Shrapnel extends Bullet {
  constructor(world, p, accuracy) {
    super(world, p, accuracy, SHRAPNEL_SPEED, 1000, 0.5);
    this.type = 1; // Shrapnel
  }
}

module.exports = Shrapnel;
