const Matter = require('./matter');
const Bullet = require('./Bullet')

const RECOIL = 0.001;
const KNOCKBACK = 0.004;
const SHOOTING_COOLDOWN = 10;
const TERMINAL_X_VELOCITY = 30;
const TERMINAL_Y_VELOCITY = 30;
const JUMP_ACCELERATION = 0.03;
const JETPACK_CHARGE_SPEED = 0.003;
const JETPACK_DRAIN_SPEED = 0.009;
const HORIZONTAL_ACCELERTION = 0.01;
const GRAVITY = 0.02;

module.exports = function(Game){
  let players = Game.players,
      bullets = Game.bullets,
      map = Game.map,
      world = Game.world;

  world.gravity.y = 0; // I'm making my own gravity

  for(var i in players){
    let p = players[i];
    if(p.deleted)
      continue;

    let body = p.body;

    if(p.energy < 1)
      p.energy += JETPACK_CHARGE_SPEED; // Charge the jetpack
    else if(p.energy > 1)
      p.energy = 1;
    else if(p.energy < 0)
      p.energy = 0;

    // Do gravity
    Matter.Body.applyForce(body,
      {x: body.position.x, y: body.position.y},
      {x: 0, y: GRAVITY}
    );

    if(p.keyboard.left){
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -HORIZONTAL_ACCELERTION, y: 0}
      );
    }

    if(p.keyboard.right){
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: HORIZONTAL_ACCELERTION, y: 0}
      );
    }

    if(p.keyboard.jump && p.energy > 0){
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: 0, y: -JUMP_ACCELERATION}
      );
      p.energy -= JETPACK_DRAIN_SPEED;
    }

    if(p.keyboard.shoot && p.shooting_cooldown === 0) {
      const bullet = new Bullet(world, p);
      bullets.push(bullet);

      // Recoil
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -RECOIL * bullet.body.velocity.x, y: -RECOIL * bullet.body.velocity.y}
      );

      p.shooting_cooldown = SHOOTING_COOLDOWN;
    }

    if(p.shooting_cooldown > 0)
      p.shooting_cooldown--;

    // Terminal Velocity
    if(body.velocity.x < -TERMINAL_X_VELOCITY)
      Matter.Body.setVelocity(body, {x: -TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.x > TERMINAL_X_VELOCITY)
      Matter.Body.setVelocity(body, {x: TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.y < -TERMINAL_Y_VELOCITY)
      Matter.Body.setVelocity(body, {x: body.velocity.x, y: -TERMINAL_Y_VELOCITY});
    if(body.velocity.y > TERMINAL_Y_VELOCITY)
      Matter.Body.setVelocity(body, {x: body.velocity.x, y: TERMINAL_Y_VELOCITY});
  }

  for(var i1 in bullets) {
    let b = bullets[i1];
    if(b.deleted) continue;

    for(var i2 in players) {
      let p = players[i2];
      if(p.deleted) continue;

      if(Matter.SAT.collides(b.body, p.body).collided){
        // Knockback
        Matter.Body.applyForce(
          p.body,
          {x: b.body.position.x, y: b.body.position.y},
          {x: KNOCKBACK * b.body.velocity.x, y: KNOCKBACK * b.body.velocity.y}
        );
        b.apoptosis();

        p.health -= 0.1;
        if(p.health <= 0)
          p.apoptosis(world);
      }
    }

    for(var i2 in map) {
      const obj = map[i2];
      if(Matter.SAT.collides(b.body, obj).collided)
        b.apoptosis();
    }
  }
}
