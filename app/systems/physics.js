const Matter = require('../lib/matter');
const insideRect = require('../lib/insideRect');
const Bullet = require('../constructors/Bullet');
const Throwable = require('../constructors/Throwable');
const io = require('./io');

const RECOIL = 0.0005;
const KNOCKBACK = 0.001;
const TERMINAL_X_VELOCITY = 30;
const TERMINAL_Y_VELOCITY = 30;
const JUMP_ACCELERATION = 0.03;
const JETPACK_CHARGE_SPEED = 0.003;
const JETPACK_DRAIN_SPEED = 0.009;
const HORIZONTAL_ACCELERTION = 0.01;
const GRAVITY = 0.003;

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
    handleThrowing(p, p.body, Game.bullets, Game.throwables);
    handleConsuming(p);
    terminalVelocity(p.body);
    chargeJetpack(p);
    sendShopData(p, Game.map.shops);
  }

  for(var i in Game.throwables){
    let t = Game.throwables[i];
    doGravity(t.body);
  }

  bulletCollisions(Game.players, Game.bullets, Game.map.bodies);
}

function doGravity(body){
  Matter.Body.applyForce(body,
    {x: body.position.x, y: body.position.y},
    {x: 0, y: GRAVITY * body.mass}
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
  const item = p.getItem();

  if(p.keyboard.shoot && item.shootingCooldown === 0) {
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

    if(item.canShoot) {
      for(var i = 0; i < item.numBullets; i++)
        spawnBullet(item.accuracy);
    }

    item.shootingCooldown = item.cooldownTime;
  }

  for(var i in p.inventory.items) {
    const item = p.inventory.items[i];
    if(item.shootingCooldown > 0)
      item.shootingCooldown--;
  }
}

function handleThrowing(p, body, bullets, throwables){
  if(p.keyboard.throw && p.inventory.amt[0] > 0) {
    const spawnThrowable = () => {
      const throwable = new Throwable(world, bullets, p);
      throwables.push(throwable);
      p.inventory.amt[0]--;
    }

    spawnThrowable();
  }
}

function handleConsuming(p) {
  if(p.keyboard.consume && p.inventory.amt[1] > 0) {
    if(p.inventory.items[1].canConsume(p)) {
      p.inventory.items[1].consume(p);
      p.inventory.amt[1]--;
    }
  }
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

    Matter.Body.setVelocity(
      b.body,
      {x: b.xv, y: b.yv}
    );

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

        p.health -= 0.1;
        if(p.health <= 0)
          if(b.player.kill)
            b.player.kill(world, p);
          else // It's a nade kill
            b.player.player.kill(world, p);

        b.apoptosis();
      }
    }

    for(var i2 in map) {
      const obj = map[i2];
      if(Matter.SAT.collides(b.body, obj).collided)
        b.apoptosis();
    }
  }
}

// Send shop data if p is trying to open a shop
function sendShopData(p, shops) {
  for(var i in shops) {
    const rect = {
      x: shops[i].x - p.radius,
      y: shops[i].y - p.radius,
      width: shops[i].width + p.radius * 2,
      height: shops[i].height + p.radius * 2
    }
    if(insideRect(p.body.position, rect) && p.keyboard.select) {
      io.shopData(p, shops[i]);
    }
  }
}
