var mouse = {
  x: 0,
  y: 0,
  down: false
}

function keydown(e, keyboard, inventory){
  switch ( e.keyCode ) {
    case 49:  // 1
      inventory.select = 0;
      break;
    case 50:  // 2
      inventory.select = 1;
      break;
    case 51:  // 3
      inventory.select = 2;
      break;
    case 65:  // A
      keyboard.left = true;
      break;
    case 67:
      inventory.select = 5;
      break;
    case 68:  // D
      keyboard.right = true;
      break;
    case 69:  // E
      keyboard.select = true;
      break;
    case 70:  // F
      keyboard.loot = true;
      break;
    case 81:  // Q
      keyboard.drop = true;
      break;
    case 87:  // W
      keyboard.jump = true;
      break;
    case 88:  // X
      inventory.select = 4;
      break;
    case 90:  // Z
      inventory.select = 3;
      break;
  }
}

function keyup(e, keyboard){
  switch ( e.keyCode ) {
    case 65:  // A
      keyboard.left = false;
      break;
    case 68:  // D
      keyboard.right = false;
      break;
    case 87:  // W
      keyboard.jump = false;
      break;
  }
}

function mousemove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  // Do some quick maths to convert the hand angle to number between 0 and 256
  let hand_angle = Math.atan2(cvs.height / 2 - e.clientY, e.clientX - cvs.width / 2);
  hand = Math.floor(256 * hand_angle / (2*Math.PI));
  if(hand < 0) hand += 256;

  return hand;
}

function mousedown (e, keyboard) {
  if(e.button === 0) {
    keyboard.shoot = true;
  }
}

function mouseup (e, keyboard) {
  if(e.button === 0) {
    mouse.down = false;
    keyboard.shoot = false;
  }
}
