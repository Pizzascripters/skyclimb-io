module.exports = Game => {
  Game.WATER_HEIGHT = 11200;   // The y level of the surface of water
  Game.MOUNTAIN_THICKNESS = 100;

  Game.RECOIL = 0.0005;
  Game.KNOCKBACK = 0.001;

  Game.TERMINAL_X_VELOCITY = 30;
  Game.TERMINAL_Y_VELOCITY = 30;
  Game.HORIZONTAL_ACCELERTION = 0.01;
  Game.GRAVITY = 0.003;
  Game.WATER_DAMAGE = 0.0025;
}
