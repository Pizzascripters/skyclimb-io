const Matter = require('../lib/matter');
const Bullet = require('../constructors/Bullet');
const Item = require('../constructors/Item');
const Loot = require('../constructors/Loot');
const Throwable = require('../constructors/Throwable');
const distance = require('../util/distance');
const insideRect = require('../util/insideRect');
const io = require('./io');

var constants = {};
require('../constants')(constants);

// Everything that needs to happen on engine tick goes here
function update(Game, delta){

  world.gravity.y = 0; // I need to make my own gravity so bullets aren't affected

  for(var i in Game.players){
    let p = Game.players[i];
    if(!p.inGame())
      continue;

    doGravity(p.body, Game.WATER_HEIGHT, Game.GRAVITY);
    handleShooting(p, p.body, Game.bullets, Game.RECOIL);
    handleMovement(p, p.body, Game.HORIZONTAL_ACCELERTION);
    handleThrowing(p, p.body, Game.bullets, Game.throwables);
    handleConsuming(p);
    handleHealing(p);
    handleShield(p, Game.map, delta);
    handleLooting(p, Game.world, Game.loot, Game.BULLET_CAP, Game.SHELL_CAP);
    handleReloading(p, delta);
    terminalVelocity(p.body, Game.TERMINAL_X_VELOCITY, Game.TERMINAL_Y_VELOCITY);
    chargeJetpack(p);
    sendShopData(p, Game.map.shops);
    if(p.keyboard.drop) dropWeapon(p, Game.world, Game.loot);

    // Dying should be at the end because we shouldn't be updating physics on dead players
    waterDamage(Game.world, Game.loot, p, Game.WATER_HEIGHT, Game.WATER_DAMAGE);

    // Perserve the bullet velocity and angle
    for(var i in Game.bullets) {
      let b = Game.bullets[i];
      if(b.deleted) continue;

      Matter.Body.setVelocity(
        b.body,
        {x: b.xv, y: b.yv}
      );

      Matter.Body.setAngle(
        b.body,
        2 * Math.PI * b.angle / 256
      )
    }

    // Sticky buttons only reset on physics update, not in io
    let stickyButtons = ["throw", "consume", "select", "drop", "loot", "reload"]
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
      p.kill(p);
    }
  }
}

function handleMovement(p, body, HORIZONTAL_ACCELERATION) {
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
      {x: 0, y: -p.jetpack.power}
    );
    p.energy -= p.jetpack.power / p.jetpack.battery;
  }

  // Loop map
  if(p.body.position.x < -30000) {
    Matter.Body.setPosition(
      body,
      {x: body.position.x + 60000, y: body.position.y}
    );
  }
  if(p.body.position.x > 30000) {
    Matter.Body.setPosition(
      body,
      {x: body.position.x - 60000, y: body.position.y}
    );
  }
  // Set height bound
  if(p.body.position.y > 30000) {
    Matter.Body.setPosition(
      body,
      {x: body.position.x, y: 30000}
    );
  }
}

function handleShooting(p, body, bullets, RECOIL) {
  const item = p.getItem();

  if(p.keyboard.shoot && item.shootingCooldown === 0 && item.type === "weapon") {
    const spawnBullet = (accuracy) => {
      const bullet = new Bullet(world, p, accuracy, 0, p.getItem().damage, p.getItem().speed);
      bullets.push(bullet);
      p.getItem().magazine--;

      // Recoil
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -RECOIL * bullet.body.velocity.x, y: -RECOIL * bullet.body.velocity.y}
      );
    }

    const spawnPellet = (accuracy) => {
      const bullet = new Bullet(world, p, accuracy, 2, p.getItem().damage, p.getItem().speed);
      bullets.push(bullet);

      // Recoil
      Matter.Body.applyForce(
        body,
        {x: body.position.x, y: body.position.y},
        {x: -RECOIL * bullet.body.velocity.x, y: -RECOIL * bullet.body.velocity.y}
      );
    }

    if(item.canShoot) {
      if(p.shieldOn()) {
        p.shield = 0;
      } else {
        if(item.shotgun) {
          if(item.magazine > 0) {
            for(var i = 0; i < item.numBullets; i++) {
              spawnPellet(item.accuracy);
            }
            item.magazine--;
            item.reloading = false;
            p.reloadProgress = 0;
          }
        } else {
          if(item.magazine > 0) {
            spawnBullet(item.accuracy);
            item.reloading = false;
            p.reloadProgress = 0;
          }
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
    p.inventory.amt[p.inventory.select] > 0 &&
    p.keyboard.shoot &&
    p.getItem().shootingCooldown === 0
  ) {
    if(p.shieldOn()) {
      p.shield = 0;
    } else {
      const throwable = new Throwable(world, bullets, p, p.getItem());
      throwables.push(throwable);
      if(--p.inventory.amt[p.inventory.select] === 0)
        p.inventory.items[p.inventory.select] = Item(0);
    }
    p.getItem().shootingCooldown = p.getItem().cooldownTime;
  }
}

function handleConsuming(p) {
  if(p.getItem().type !== "consumable") return 1;
  if(
    p.getItem().canConsume(p) &&
    p.inventory.amt[p.inventory.select] > 0 &&
    p.keyboard.shoot &&
    p.getItem().shootingCooldown === 0
  ) {
    if(p.shieldOn()) {
      p.shield = 0;
    } else {
      p.getItem().consume(p);
      if(--p.inventory.amt[p.inventory.select] === 0)
        p.inventory.items[p.inventory.select] = Item(0);
    }
    p.getItem().shootingCooldown = p.getItem().cooldownTime;
  }
}

function handleHealing(p) {
  if(p.shieldOn()) return;
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

function handleShield(p, map, delta) {
  p.shield -= delta;
  if(p.shield < 0) p.shield = 0;
  if(p.inSafezone(map)) {
    p.replenishShield();
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

function chargeJetpack(p){
  if(p.energy < 1)
    p.energy += p.jetpack.recharge / p.jetpack.battery;

  if(p.energy > 1)
    p.energy = 1;
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
    loot.push(new Loot(world, p.getItem(), p.body.position, 2 * Math.PI * p.hand / 256, p.getAmt()));
  }

  // Copy an empty item into the player's selected slot
  p.inventory.items[p.inventory.select] = Item(0);
}

// Called when player tries to loot
function handleLooting(p, world, loot, BULLET_CAP, SHELL_CAP) {
  // Find the closest loot
  let minDistance = Infinity;
  let closest = null; // The index of the nearest loot
  for(var i in loot) {
    const dist = distance(p.body.position, loot[i].body.position);
    if(dist < minDistance &&
      dist < p.radius + loot[i].radius &&
      (
        p.keyboard.loot ||
        loot[i].item.id === 224 && p.bullets < BULLET_CAP ||
        loot[i].item.id === 225 && p.shells < SHELL_CAP
      )
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

function handleReloading(p, delta) {
  // Make sure that any items that aren't selected aren't reloading
  for(var i in p.inventory.items) {
    if(Number(i) !== p.inventory.select) {
      p.inventory.items[i].reloading = false;
    }
  }
  if(!p.getItem().reloading) {
    p.reloadProgress = 0;
  }

  // Check if player should begin reloading
  var ammo = p.getItem().shotgun ? p.shells : p.bullets;
  if(
    (p.keyboard.reload || p.getItem().magazine === 0) &&
    p.getItem().magazine !== p.getItem().magazineSize &&
    ammo > 0
  ) {
    p.getItem().reloading = true;
  }

  // Update reloading progress if reloading
  if(p.getItem().reloading) {
    p.reloadProgress += delta / p.getItem().reloadTime;
  }

  // Reload and stop progress if progress has finished
  if(p.reloadProgress >= 1) {
    p.getItem().reloading = false;
    p.getItem().reload(p);
    p.reloadProgress = 0;
  }
}

function collision(pairs) {
   pairs.forEach(({ bodyA, bodyB }) => {
     var bodyTypes = ["bullet", "mountain", "safezone", "player"];
     if(bodyTypes.indexOf(bodyA.type) > bodyTypes.indexOf(bodyB.type)) {
       // Swap the bodies
       var tempBody = bodyA;
       bodyA = bodyB;
       bodyB = tempBody;
     }
     if (bodyA.type === "bullet" && !bodyA.bullet.deleted) {
       if(bodyB.type === "mountain" || bodyB.type === "safezone") {
         bodyA.bullet.apoptosis();
       }else if(bodyB.type === "player" && !bodyB.player.deleted) {
         if(!bodyB.player.shieldOn()) {
           // Knockback
           Matter.Body.applyForce(
             bodyB,
             {x: bodyA.position.x, y: bodyA.position.y},
             {x: constants.KNOCKBACK * bodyA.velocity.x, y: constants.KNOCKBACK * bodyA.velocity.y}
           );
           bodyA.bullet.hit(bodyB.player);
         }
         bodyA.bullet.apoptosis();
       }
     }
  });
}

module.exports = {
  update,
  collision
}
