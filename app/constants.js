module.exports = Game => {
  Game.WATER_HEIGHT = 8500;   // The y level of the surface of water
  Game.VISIBILITY = 1100;     // Any objectect at a greater distance will not be sent to client
  Game.MOUNTAIN_THICKNESS = 100;

  Game.RECOIL = 0.0005;
  Game.KNOCKBACK = 0.001;

  Game.TERMINAL_X_VELOCITY = 30;
  Game.TERMINAL_Y_VELOCITY = 30;
  Game.JETPACK_ACCELERATION = 0.03;
  Game.JETPACK_CHARGE_SPEED = 0.003;
  Game.JETPACK_DRAIN_SPEED = 0.009;
  Game.HORIZONTAL_ACCELERTION = 0.01;
  Game.GRAVITY = 0.003;
  Game.WATER_DAMAGE = 0.01;
}
