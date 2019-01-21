module.exports = Game => {
  Game.MAX_HEIGHT = 12000;
  Game.MIN_HEIGHT = -200;
  Game.WATER_HEIGHT = 11200;   // The y level of the surface of water
  Game.MOUNTAIN_THICKNESS = 100;

  Game.RECOIL = 0.0005;
  Game.KNOCKBACK = 0.001;

  Game.TERMINAL_X_VELOCITY = 30;
  Game.TERMINAL_Y_VELOCITY = 30;
  Game.HORIZONTAL_ACCELERTION = 0.01;
  Game.GRAVITY = 0.003;
  Game.WATER_DAMAGE = 0.0025;

  Game.BULLET_CAP = 5000;
  Game.SHELL_CAP = 5000;
  Game.GOLD_CAP = 30000;

  Game.SHIELD_MILLIS = 5000;

  Game.packetsPerSecond = 60;
  Game.DEBUG = {
    PING: 0 // A fake ping time for testing on local servers
  }
}
