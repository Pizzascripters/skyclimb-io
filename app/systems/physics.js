const Matter = require('../lib/matter');
const Bullet = require('../constructors/Bullet');
const Item = require('../constructors/Item');
const Loot = require('../constructors/Loot');
const Throwable = require('../constructors/Throwable');
const distance = require('../util/distance');
const insideRect = require('../util/insideRect');
const io = require('./io');

// Everything that needs to happen on engine tick goes here
module.exports = function(Game){

  world.gravity.y = 0; // I need to make my own gravity so bullets aren't affected

  for(var i in Game.players){
    let p = Game.players[i];
    if(!p.inGame())
      continue;

    doGravity(p.body, Game.WATER_HEIGHT, Game.GRAVITY);
    waterDamage(Game.world, Game.loot, p, Game.WATER_HEIGHT, Game.WATER_DAMAGE);
    handleMovement(p, p.body, Game.HORIZONTAL_ACCELERTION, Game.JETPACK_ACCELERATION, Game.JETPACK_DRAIN_SPEED);
    handleShooting(p, p.body, Game.bullets, Game.RECOIL);
    handleThrowing(p, p.body, Game.bullets, Game.throwables);
    handleConsuming(p);
    handleHealing(p);
    handleLooting(p, Game.world, Game.loot);
    terminalVelocity(p.body, Game.TERMINAL_X_VELOCITY, Game.TERMINAL_Y_VELOCITY);
    chargeJetpack(p, Game.JETPACK_CHARGE_SPEED);
    sendShopData(p, Game.map.shops);
    if(p.keyboard.drop) dropWeapon(p, Game.world, Game.loot);

    // Sticky buttons only reset on physics update, not in io
    let stickyButtons = ["throw", "consume", "select", "drop", "loot"]
    for(var i in p.keyboard) {
      if(stickyButtons.indexOf(i) !== -1) {
        p.keyboard[i] = false;
      }
    }
  }

  for(var i in Game.throwables){
    let t = Game.throwables[i];
    doGravity(t.body, Game.WATER_HEIGHT, Game.GRAVITY);
  }

  for(var i in Game.loot){
    let l = Game.loot[i];
    doGravity(l.body, Game.WATER_HEIGHT, Game.GRAVITY);
  }

  bulletCollisions(Game.players, Game.bullets, Game.map.bodies, Game.loot, Game.KNOCKBACK);
}

function doGravity(body, WATER_HEIGHT, GRAVITY){
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

function waterDamage(world, loot, p, WATER_HEIGHT, WATER_DAMAGE) {
  if(p.body.position.y >= WATER_HEIGHT) {
    p.health -= WATER_DAMAGE;
    if(p.health <= 0) {
      p.kill(world, p, loot);
    }
  }
}

function handleMovement(p, body, HORIZONTAL_ACCELERATION, JETPACK_ACCELERATION, JETPACK_DRAIN_SPEED) {
  if(p.keyboard.left){
    Matter.Body.applyForce(
      body,
      {x: body.position.x, y: body.position.y},
      {x: -HORIZONTAL_ACCELERATION, y: 0}
    );
  }

  if(p.keyboard.right){
    Matter.Body.applyForce(
      body,
      {x: body.position.x, y: body.position.y},
      {x: HORIZONTAL_ACCELERATION, y: 0}
    );
  }

  if(p.keyboard.jump && p.energy > 0){
    Matter.Body.applyForce(
      body,
      {x: body.position.x, y: body.position.y},
      {x: 0, y: -JETPACK_ACCELERATION}
    );
    p.energy -= JETPACK_DRAIN_SPEED;
  }
}

function handleShooting(p, body, bullets, RECOIL) {
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

function handleHealing(p) {
  p.health += p.healPerTick;
  p.amountToHeal -= p.healPerTick;
  if(p.health > 1) {
    p.health = 1;
  }
  if(p.amountToHeal <= 0) {
    p.amountToHeal = 0;
    p.healPerTick = 0;
    p.healing = false;
  }
}

function terminalVelocity(body, TERMINAL_X_VELOCITY, TERMINAL_Y_VELOCITY){
  if(body.velocity.x < -TERMINAL_X_VELOCITY)
    Matter.Body.setVelocity(body, {x: -TERMINAL_X_VELOCITY, y: body.velocity.y});
  if(body.velocity.x > TERMINAL_X_VELOCITY)
    Matter.Body.setVelocity(body, {x: TERMINAL_X_VELOCITY, y: body.velocity.y});
  if(body.velocity.y < -TERMINAL_Y_VELOCITY)
    Matter.Body.setVelocity(body, {x: body.velocity.x, y: -TERMINAL_Y_VELOCITY});
  if(body.velocity.y > TERMINAL_Y_VELOCITY)
    Matter.Body.setVelocity(body, {x: body.velocity.x, y: TERMINAL_Y_VELOCITY});
}

function chargeJetpack(p, JETPACK_CHARGE_SPEED){
  if(p.energy < 1)
    p.energy += JETPACK_CHARGE_SPEED; // Charge the jetpack

  if(p.energy > 1)
    p.energy = 1;
  else if(p.energy < 0)
    p.energy = 0;
}

function bulletCollisions(players, bullets, map, loot, KNOCKBACK){
  for(var i1 in bullets) {
    let b = bullets[i1];
    if(b.deleted) continue;

    Matter.Body.setVelocity(
      b.body,
      {x: b.xv, y: b.yv}
    );

    for(var i2 in players) {
      let p = players[i2];
      if(!p.inGame()) continue;

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
      if(Matter.SAT.collides(b.body, obj).collided) {
        b.apoptosis();
      }
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
      io.sendShopMenu(p, shops[i]);
    }
  }
}

// Called when player drops a weapon
function dropWeapon(p, world, loot){
  // Spawn a new item
  if(p.getItem().id !== 0) {
    loot.push(new Loot(world, p.getItem().id, p.body.position, 2 * Math.PI * p.hand / 256, p.getAmt()));
  }

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
