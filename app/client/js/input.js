function keydown(e, keyboard, inventory){
  switch ( e.keyCode ) {
    case 49:  // 1
      inventory.select = 2;
      break;
    case 50:  // 2
      inventory.select = 3;
      break;
    case 51:  // 3
      inventory.select = 4;
      break;
    case 65:  // A
      keyboard.left = true;
      break;
    case 68:  // D
      keyboard.right = true;
      break;
    case 87:  // W
      keyboard.jump = true;
      break;
    case 90:  // Z
      keyboard.cook = true;
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
    case 88:  // X
      keyboard.consume = true;
      break;
    case 90:  // Z
      keyboard.cook = false;
      keyboard.throw = true;
      break;
  }
}

function mousemove(e) {
  let hand_angle = Math.atan2(cvs.height / 2 - e.clientY, e.clientX - cvs.width / 2);
  hand = Math.floor(256 * hand_angle / (2*Math.PI));
  if(hand < 0) hand += 256;

  return hand;
}

function mousedown (e, keyboard) {
  keyboard.shoot = true;
}

function mouseup (e, keyboard) {
  keyboard.shoot = false;
}
