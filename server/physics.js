const Matter = require('./matter');
const Bullet = require('./Bullet')

const TERMINAL_X_VELOCITY = 30;
const TERMINAL_Y_VELOCITY = 30;
const JUMP_ACCELERATION = 0.04;
const HORIZONTAL_ACCELERTION = 0.02;
const GRAVITY = 0.03;

var counter = 0;  // Counts number of updates

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
    if(p.keyboard.shoot && counter % 10 === 0) {
      var bullet = new Bullet(Matter, world, p);
      Matter.World.addBody(world, bullet.body);
      bullets.push(bullet);
    }

    // Terminal Velocity
    if(body.velocity.x < -TERMINAL_X_VELOCITY) Matter.Body.setVelocity(body, {x: -TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.x > TERMINAL_X_VELOCITY) Matter.Body.setVelocity(body, {x: TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.y < -TERMINAL_Y_VELOCITY) Matter.Body.setVelocity(body, {x: body.velocity.x, y: -TERMINAL_Y_VELOCITY});
    if(body.velocity.y > TERMINAL_Y_VELOCITY) Matter.Body.setVelocity(body, {x: body.velocity.x, y: TERMINAL_Y_VELOCITY});
  }

  for(var i1 in bullets) {
    var b = bullets[i1];

    for(var i2 in players) {
      var p = players[i2];
      if(Matter.SAT.collides(b.body, p.body).collided) b.apoptosis();
    }

    for(var i2 in map) {
      var obj = map[i2];
      if(Matter.SAT.collides(b.body, obj).collided) b.apoptosis();
    }
  }

  counter++;
}
