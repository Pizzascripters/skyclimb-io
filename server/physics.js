const Matter = require('./matter');
const Bullet = require('./Bullet')

const RECOIL = 0.0005;
const KNOCKBACK = 0.004;
const TERMINAL_X_VELOCITY = 30;
const TERMINAL_Y_VELOCITY = 30;
const JUMP_ACCELERATION = 0.03;
const JETPACK_CHARGE_SPEED = 0.003;
const JETPACK_DRAIN_SPEED = 0.009;
const HORIZONTAL_ACCELERTION = 0.01;
const GRAVITY = 0.02;

const SHOOTING_COOLDOWN = {
  1: 10,
  64: 30
}

module.exports = function(Game){

  world.gravity.y = 0; // I'm making my own gravity

  for(var i in Game.players){
    let p = Game.players[i];
    if(p.deleted)
      continue;

    doGravity(p.body);
    handleMovement(p, p.body);
    handleShooting(p, p.body, Game.bullets);
    terminalVelocity(p.body);
    chargeJetpack(p);
  }

  bulletCollisions(Game.players, Game.bullets, Game.map.bodies);
}

function doGravity(body){
  Matter.Body.applyForce(body,
    {x: body.position.x, y: body.position.y},
    {x: 0, y: GRAVITY}
  );
}

function handleMovement(p, body) {
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
}

function handleShooting(p, body, bullets) {
  if(p.keyboard.shoot && p.shooting_cooldown === 0) {
    const spawnBullet = (accuracy) => {
      const bullet = new Bullet(world, p, accuracy);
      bullets.push(bullet);

      // Recoil
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -RECOIL * bullet.body.velocity.x, y: -RECOIL * bullet.body.velocity.y}
      );
    }

    if(p.getItem() === 1)
      spawnBullet(Math.PI / 20)
    else if(p.getItem() === 64)
      for(var i = 0; i < 10; i++) spawnBullet(Math.PI / 8);

    p.shooting_cooldown = SHOOTING_COOLDOWN[String(p.getItem())];
  }

  if(p.shooting_cooldown > 0)
    p.shooting_cooldown--;
}

function terminalVelocity(body){
  if(body.velocity.x < -TERMINAL_X_VELOCITY)
    Matter.Body.setVelocity(body, {x: -TERMINAL_X_VELOCITY, y: body.velocity.y});
  if(body.velocity.x > TERMINAL_X_VELOCITY)
    Matter.Body.setVelocity(body, {x: TERMINAL_X_VELOCITY, y: body.velocity.y});
  if(body.velocity.y < -TERMINAL_Y_VELOCITY)
    Matter.Body.setVelocity(body, {x: body.velocity.x, y: -TERMINAL_Y_VELOCITY});
  if(body.velocity.y > TERMINAL_Y_VELOCITY)
    Matter.Body.setVelocity(body, {x: body.velocity.x, y: TERMINAL_Y_VELOCITY});
}

function chargeJetpack(p){
  if(p.energy < 1)
    p.energy += JETPACK_CHARGE_SPEED; // Charge the jetpack

  if(p.energy > 1)
    p.energy = 1;
  else if(p.energy < 0)
    p.energy = 0;
}

function bulletCollisions(players, bullets, map){
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
