const Matter = require('./matter');
const Bullet = require('./Bullet')

const FIRE_KNOCKBACK = 0.003;
const IMPACT_KNOCKBACK = 0.008;
const SHOOTING_COOLDOWN = 10;
const TERMINAL_X_VELOCITY = 30;
const TERMINAL_Y_VELOCITY = 30;
const JUMP_ACCELERATION = 0.04;
const HORIZONTAL_ACCELERTION = 0.02;
const GRAVITY = 0.03;

var shooting_cooldown = 0;  // Number of frames until player can shoot again

module.exports = function(e, Matter, world, map, players, bullets){
  world.gravity.y = 0; // I'm making my own gravity

  for(var i in players){
    var p = players[i];
    if(p.deleted) continue;

    var body = p.body;

    Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: 0, y: GRAVITY});

    if(p.keyboard.left) Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: -HORIZONTAL_ACCELERTION, y: 0});
    if(p.keyboard.right) Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: HORIZONTAL_ACCELERTION, y: 0});
    if(p.keyboard.jump) Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: 0, y: -JUMP_ACCELERATION});
    if(p.keyboard.shoot && shooting_cooldown === 0) {
      var bullet = new Bullet(Matter, world, p);
      Matter.World.addBody(world, bullet.body);
      bullets.push(bullet);
      shooting_cooldown = SHOOTING_COOLDOWN;
      Matter.Body.applyForce( // Knockback
        body,
        {x: body.position.x, y: body.position.y},
        {x: -FIRE_KNOCKBACK * bullet.body.velocity.x, y: -FIRE_KNOCKBACK * bullet.body.velocity.y}
      );
    }

    // Terminal Velocity
    if(body.velocity.x < -TERMINAL_X_VELOCITY) Matter.Body.setVelocity(body, {x: -TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.x > TERMINAL_X_VELOCITY) Matter.Body.setVelocity(body, {x: TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.y < -TERMINAL_Y_VELOCITY) Matter.Body.setVelocity(body, {x: body.velocity.x, y: -TERMINAL_Y_VELOCITY});
    if(body.velocity.y > TERMINAL_Y_VELOCITY) Matter.Body.setVelocity(body, {x: body.velocity.x, y: TERMINAL_Y_VELOCITY});
  }

  for(var i1 in bullets) {
    var b = bullets[i1];
    if(b.deleted) continue

    for(var i2 in players) {
      var p = players[i2];
      if(p.deleted) continue;

      if(Matter.SAT.collides(b.body, p.body).collided){
        Matter.Body.applyForce( // Knockback
          p.body,
          {x: b.body.position.x, y: b.body.position.y},
          {x: IMPACT_KNOCKBACK * b.body.velocity.x, y: IMPACT_KNOCKBACK * b.body.velocity.y}
        );
        b.apoptosis();
      }
    }

    for(var i2 in map) {
      var obj = map[i2];
      if(Matter.SAT.collides(b.body, obj).collided) b.apoptosis();
    }
  }

  if(shooting_cooldown > 0) shooting_cooldown--;
}
