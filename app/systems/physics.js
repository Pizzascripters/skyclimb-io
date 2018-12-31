const Matter = require('../lib/matter');
const Bullet = require('../constructors/Bullet');
const Item = require('../constructors/Item');
const Loot = require('../constructors/Loot');
const Throwable = require('../constructors/Throwable');
const distance = require('../util/distance');
const insideRect = require('../util/insideRect');
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
const WATER_DAMAGE = 0.01;

const SHOOTING_COOLDOWN = {
  1: 10,
  64: 30
}

module.exports = function(Game){

  world.gravity.y = 0; // I'm making my own gravity

  for(var i in Game.players){
    let p = Game.players[i];
    if(p.state !== p.PLAYING && p.state !== p.DISCONNECTED)
      continue;

    doGravity(p.body, Game.WATER_HEIGHT);
    waterDamage(Game.world, Game.loot, p, Game.WATER_HEIGHT);
    handleMovement(p, p.body);
    handleShooting(p, p.body, Game.bullets);
    handleThrowing(p, p.body, Game.bullets, Game.throwables);
    handleConsuming(p);
    terminalVelocity(p.body);
    chargeJetpack(p);
    sendShopData(p, Game.map.shops);
    if(p.keyboard.drop) dropWeapon(p, Game.world, Game.loot);
    handleLooting(p, Game.world, Game.loot);

    // Sticky buttons only reset on update, not in io
    let stickyButtons = ["throw", "consume", "select", "drop", "loot"]
    for(var i in p.keyboard) {
      if(stickyButtons.indexOf(i) !== -1) {
        p.keyboard[i] = false;
      }
    }
  }

  for(var i in Game.throwables){
    let t = Game.throwables[i];
    doGravity(t.body, Game.WATER_HEIGHT, true);
  }

  for(var i in Game.loot){
    let l = Game.loot[i];
    doGravity(l.body, Game.WATER_HEIGHT, true);
  }

  bulletCollisions(Game.players, Game.bullets, Game.map.bodies, Game.loot);
}

function doGravity(body, WATER_HEIGHT, floats){
  Matter.Body.applyForce(body,
    {x: body.position.x, y: body.position.y},
    {x: 0, y: GRAVITY * body.mass}
  );

  const levelUnderWater = body.bounds.max.y - WATER_HEIGHT;
  if(levelUnderWater > 0) {
    const height = body.bounds.max.y - body.bounds.min.y;
    var portionUnderWater = levelUnderWater / height;
    if(portionUnderWater > 1) portionUnderWater = 1
    Matter.Body.applyForce(body,
      {x: body.position.x, y: body.position.y},
      {x: 0, y: -1.3 * GRAVITY * portionUnderWater * body.mass}
    );
  }
}

function waterDamage(world, loot, p, WATER_HEIGHT) {
  if(p.body.position.y >= WATER_HEIGHT) {
    p.health -= WATER_DAMAGE;
    if(p.health <= 0) {
      p.kill(world, p, loot);
    }
  }
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

  if(p.keyboard.shoot && item.shootingCooldown === 0 && item.type === "weapon") {
    const spawnBullet = (accuracy) => {
      const bullet = new Bullet(world, p, accuracy);
      bullets.push(bullet);

      // Recoil
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -RECOIL * bullet.body.velocity.x, y: -RECOIL * bullet.body.velocity.y}
      );
      p.bullets--;
    }

    const spawnPellet = (accuracy) => {
      const bullet = new Bullet(world, p, accuracy, 2, 0.1);
      bullets.push(bullet);

      // Recoil
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -RECOIL * bullet.body.velocity.x, y: -RECOIL * bullet.body.velocity.y}
      );
    }

    if(item.canShoot) {
      if(item.shotgun) {
        if(p.shells > 0) {
          for(var i = 0; i < item.numBullets; i++) {
            spawnPellet(item.accuracy);
          }
          p.shells--;
        }
      } else {
        if(p.bullets > 0) {
          spawnBullet(item.accuracy);
        }
      }
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
  if(p.getItem().type !== "throwable") return 1;
  if(
    p.inventory.amt[p.inventory.select - 3] > 0 &&
    p.keyboard.shoot &&
    p.getItem().shootingCooldown === 0
  ) {
    const throwable = new Throwable(world, bullets, p, p.getItem());
    throwables.push(throwable);
    if(--p.inventory.amt[p.inventory.select - 3] === 0)
      p.inventory.items[p.inventory.select] = new Item(0);
    p.getItem().shootingCooldown = p.getItem().cooldownTime;
  }
}

function handleConsuming(p) {
  if(p.getItem().type !== "consumable") return 1;
  if(
    p.getItem().canConsume(p) &&
    p.inventory.amt[p.inventory.select - 3] > 0 &&
    p.keyboard.shoot &&
    p.getItem().shootingCooldown === 0
  ) {
    p.getItem().consume(p);
    if(--p.inventory.amt[p.inventory.select - 3] === 0)
      p.inventory.items[p.inventory.select] = new Item(0);
    p.getItem().shootingCooldown = p.getItem().cooldownTime;
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

function bulletCollisions(players, bullets, map, loot){
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

        b.hit(p, loot);
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

// Called when player drops a weapon
function dropWeapon(p, world, loot){
  // Spawn a new item
  if(p.getItem().id !== 0)
    loot.push(new Loot(world, p.getItem().id, p.body.position, 2 * Math.PI * p.hand / 256));

  // Copy an empty item into the player's selected slot
  let dest = p.getItem();
  const src = new Item(0);
  for(var i in src)
    dest[i] = src[i];
}

// Called when player tries to loot
function handleLooting(p, world, loot) {
  // Find the closest loot
  let minDistance = Infinity;
  let closest = null; // The index of the nearest loot
  for(var i in loot) {
    const dist = distance(p.body.position, loot[i].body.position);
    if(dist < minDistance &&
      dist < p.radius + loot[i].radius &&
      (p.keyboard.loot || loot[i].item.id === 224 || loot[i].item.id === 225)
    ) {
      minDistance = dist;
      closest = loot[i];
    }
  }

  // If there is attainable loot and we can acquire it, acquire it and delete
  if(closest !== null) {
    if(p.acquire(closest.item, closest.amount)) {
      closest.apoptosis();
    }
  }
}
