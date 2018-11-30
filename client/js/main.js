var cvs, ctx;         // Canvas and context
var ws;               // Websocket
var prevTime = 0;     // Time of last frame
var hand = 0;         // Angle of the hand
var pingStart;        // The time we sent out the ping
var players = [];
var map = [];
var bullets = [];
var keyboard = {
  left: false,
  right: false,
  jump: false,
  shoot: false
}
var cam = {x:0, y:0}; // Position of the camera
var images = {};
var items = {};

var inventory = {
  select: 5,
  anim: [0, 0, 0, 80, 80, 90, 0, 0, 0],
  items: [0, 0, 0, 0, 0, 1, 0, 0, 0]
}

window.addEventListener("load", init);
window.addEventListener("resize", fullscreen);
window.addEventListener("mousemove", mousemove);
window.addEventListener("mousedown", mousedown);
window.addEventListener("mouseup", mouseup);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

function init(e){
  cvs = document.getElementById("cvs");
  ctx = cvs.getContext("2d");

  // Connect to websocket server
  if( window.location.href.startsWith("https") ) {
      ws = new WebSocket("wss://" + window.location.href.substring(6));
  } else {
    ws = new WebSocket("ws://" + window.location.href.substring(5));
  }
  ws.binaryType = "arraybuffer"; // Allows us to recieve byte strings from the server
  ws.onmessage = handleMessage;
  ws.onclose = () => {
    console.error("Socket closed");
    clearInterval(sendKeyboardInterval);
  };

  fullscreen();
  loadImages(() => {update(0)});
  initItems();

  const sendKeyboardInterval = setInterval(sendKeyboard, 1000 / 60);
}

function fullscreen(e){
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

function keydown(e){
  switch ( e.keyCode ) {
    case 49:  // 1
      inventory.select = 3;
      break;
    case 50:  // 2
      inventory.select = 4;
      break;
    case 51:  // 3
      inventory.select = 5;
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
  }
}

function keyup(e){
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
  let hand_angle = Math.atan2(cvs.height / 2 - e.clientY, e.clientX - cvs.width / 2);
  hand = Math.floor(256 * hand_angle / (2*Math.PI));
  if(hand < 0) hand += 256;
}

function mousedown (e) {
  keyboard.shoot = true;
}

function mouseup (e) {
  keyboard.shoot = false;
}

// Runs constantly, only param is time since last frame
function update(time){
  let delta = time - prevTime;  // Time since last frame
  prevTime = time;

  draw();
  anim.main(delta);

  requestAnimationFrame(update);
}

// Given a packet, reads the first byte, sends it to a more specific function
function handleMessage(packet){
  var data = new Uint8Array(packet.data);

  switch(data[0]){
    case 0: // Ping
      pong(packet);
      break;
    case 1: // Map data
      setMap(new Uint8Array(packet.data));
      break;
    case 2: // Player data
      setPlayers(new Uint8Array(packet.data));
      break;
  }
}

// Sends a 1 byte packet to the server
function ping(){
  if(ws.readyState != ws.OPEN)
    return 1;

  pingStart = window.performance.now();
  ws.send(new Uint8Array(1));
}

// Sends keyboard input to server
function sendKeyboard(){
  if(ws.readyState != ws.OPEN)
    return 1;

  let packet = [];
  packet[0] = 1;
  packet[1] = hand;
  packet[2] = keyboard.left;
  packet[3] = keyboard.right;
  packet[4] = keyboard.jump;
  packet[5] = keyboard.shoot;
  packet[6] = inventory.select;
  ws.send( new Uint8Array(packet) );
}

// Requests the map data in case we didn't get it
function requestMapData(){
  if(ws.readyState != ws.OPEN)
    return 1;

  ws.send(new Uint8Array(2));
}

// Called when client recieves pong packet
function pong(packet){
  console.log("Ping to %s took " + Math.round(window.performance.now() - pingStart) + " ms", packet.origin);
}

// Called when client recieves map data
function setMap(data){
  map = [];

  let ref = {i:1}; // We want to pass i by reference to readInt can increment it
  while(ref.i < data.length){
    var numVertices = readInt(data, ref);

    var body = {};
    body.vertices = [];
    for(var n = 0; n < numVertices; n++) {
      body.vertices[n] = {};
      body.vertices[n].x = readInt(data, ref);
      body.vertices[n].y = readInt(data, ref);
    }

    map.push(body);
  }
}

// Called when client recieves player information
function setPlayers(data){
  players = [];
  bullets = [];

  let ref = {i:2}; // We want to pass i by reference to readInt can increment it
  while(ref.i < data[1] * PLAYER_BYTES){

    var player = {};
    player.vertices = [];
    player.x = player.y = 0;  // For finding the avergae vertex position

    for(var n = 0; n < VERTICES_PER_PLAYER; n++) {
      player.vertices[n] = {};
      player.x += player.vertices[n].x = readInt(data, ref);
      player.y += player.vertices[n].y = readInt(data, ref);
    }

    player.x /= player.vertices.length; // Find the average
    player.y /= player.vertices.length;

    player.hand = readInt(data, ref);
    player.health = readInt(data, ref) / 255;
    player.weapon = readInt(data, ref);

    players.push(player);

    if(players.length === 1) {
      cam.x = player.x;
      cam.y = player.y;
    }
  }

  while(ref.i < data.length){
    var bullet = {};
    bullet.vertices = [];
    for(var n = 0; n < VERTICES_PER_BULLET; n++) {
      bullet.vertices[n] = {};
      bullet.vertices[n].x = readInt(data, ref);
      bullet.vertices[n].y = readInt(data, ref);
    }

    bullet.angle = readInt(data, ref);

    bullets.push(bullet);
  }
}

function loadImages(callback) {
  var count = 0;
  var onload = () => {
    count++;
    if(count === Object.keys(images).length) callback();
  }

  images.eyes = loadImage("eyes.png", onload);
  images.pistol = loadImage("pistol.png", onload);
  images.bullet = loadImage("bullet.png", onload);
  images.healthbar = loadImage("healthbar.png", onload);
}

function loadImage(src, callback) {
  var img = new Image();
  img.src = "img/" + src;
  img.onload = callback;
  return img;
}

// Reads a four byte intereger from an index in a byte array
function readInt(a, ref) {
  let b1 = a[ref.i];
  let b2 = a[ref.i+1];
  let b3 = a[ref.i+2];
  let b4 = a[ref.i+3];
  ref.i += 4;
  return bytesToInt([b1, b2, b3, b4]);
}

// Converts a 4 byte uint8array to an integer
function bytesToInt(b){
  return b[3] + 256*b[2] + 65536*b[1] + 16777216*b[0] - 2147483648;
}
