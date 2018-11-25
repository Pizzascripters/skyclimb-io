const Matter = require('./matter');

const TERMINAL_X_VELOCITY = 30;
const TERMINAL_Y_VELOCITY = 30;
const JUMP_ACCELERATION = 0.05;
const HORIZONTAL_ACCELERTION = 0.03;
const GRAVITY = 2.5;

module.exports = function(world, map, players){
  world.gravity.y = GRAVITY;

  for(var i in players){
    var p = players[i];
    if(p.deleted) continue;

    var body = p.body;

    if(p.keyboard.left) Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: -HORIZONTAL_ACCELERTION, y: 0});
    if(p.keyboard.right) Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: HORIZONTAL_ACCELERTION, y: 0});
    if(p.keyboard.jump) Matter.Body.applyForce(body, {x: body.position.x, y: body.position.y}, {x: 0, y: -JUMP_ACCELERATION});

    // Terminal Velocity
    if(body.velocity.x < -TERMINAL_X_VELOCITY) Matter.Body.setVelocity(body, {x: -TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.x > TERMINAL_X_VELOCITY) Matter.Body.setVelocity(body, {x: TERMINAL_X_VELOCITY, y: body.velocity.y});
    if(body.velocity.y < -TERMINAL_Y_VELOCITY) Matter.Body.setVelocity(body, {x: body.velocity.x, y: -TERMINAL_Y_VELOCITY});
    if(body.velocity.y > TERMINAL_Y_VELOCITY) Matter.Body.setVelocity(body, {x: body.velocity.x, y: TERMINAL_Y_VELOCITY});
  }
}
