var cvs, ctx;         // Canvas and context
var ws;               // Websocket
var prevTime = 0;     // Time of last frame
var hand = 0;         // Angle of the hand
var pingStart;        // The time we sent out the ping
var players = [];
var map = [];
var keyboard = {
  left: false,
  right: false,
  jump: false
}
var cam = {x:0, y:0}; // Position of the camera

window.addEventListener("load", init);
window.addEventListener("resize", fullscreen);
window.addEventListener("mousemove", mousemove);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

function init(e){
  cvs = document.getElementById("cvs");
  ctx = cvs.getContext("2d");

  if( window.location.href.startsWith("https") ) {
      ws = new WebSocket("wss://" + window.location.href.substring(6))
  } else {
    ws = new WebSocket("ws://" + window.location.href.substring(5))
  }
  ws.binaryType = "arraybuffer"; // Allows us to recieve byte strings from the server
  ws.onmessage = handleMessage;
  ws.onclose = socketClose;

  fullscreen();
  update(0);

  setInterval(sendKeyboard, 1000 / 60);
}

function fullscreen(e){
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

function keydown(e){
  switch ( e.keyCode ) {
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
  hand = Math.floor(256 * Math.atan2(cvs.height / 2 - e.clientY, e.clientX - cvs.width / 2) / (2*Math.PI));
  if(hand < 0) hand += 256;
}

// Runs constantly, only param is time since last frame
function update(time){
  var delta = time - prevTime;  // Time since last frame
  prevTime = time;

  draw(delta);

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

// Prints an error message when the socket closes
function socketClose(){
  console.error("Socket closed");
}

// Sends a 1 byte packet to the server
function ping(){
  pingStart = window.performance.now();
  ws.send(new Uint8Array(1));
}

// Sends keyboard input to server
function sendKeyboard(){
  var packet = new Uint8Array(5);
  packet[0] = 1;
  packet[1] = keyboard.left;
  packet[2] = keyboard.right;
  packet[3] = keyboard.jump;
  packet[4] = hand;
  ws.send(packet);
}

// Requests the map data in case we didn't get it
function requestMapData(){
  ws.send(new Uint8Array(2));
}

// Called when client recieves pong packet
function pong(packet){
  console.log("Ping to %s took " + Math.round(window.performance.now() - pingStart) + " ms", packet.origin);
}

// Called when client recieves map data
function setMap(data){
  map = [];

  var i = 1;
  while(i < data.length){
    var numVertices = bytesToInt( new Uint8Array([data[i], data[i+1], data[i+2], data[i+3]]) );
    i += 4;

    var body = {};
    body.vertices = [];
    for(var n = 0; n < numVertices * VERTEX_SIZE; n += VERTEX_SIZE) {
      body.vertices[n/VERTEX_SIZE] = {};
      body.vertices[n/VERTEX_SIZE].x = bytesToInt( new Uint8Array([data[i+n], data[i+n+1], data[i+n+2], data[i+n+3]]) );
      body.vertices[n/VERTEX_SIZE].y = bytesToInt( new Uint8Array([data[i+n+4], data[i+n+5], data[i+n+6], data[i+n+7]]) );
    }
    map.push(body);

    i += numVertices * VERTEX_SIZE
  }
}

// Called when client recieves player information
function setPlayers(data){
  players = [];
  for(var i = 1; i < data.length; i += PLAYER_BYTES){
    var player = {};
    player.vertices = [];
    player.x = player.y = 0;  // For finding the avergae vertex position
    for(var n = 0; n < VERTICES_PER_PLAYER * VERTEX_SIZE; n += VERTEX_SIZE) {
      player.vertices[n/VERTEX_SIZE] = {};
      player.x += player.vertices[n/VERTEX_SIZE].x = bytesToInt( new Uint8Array([data[i+n], data[i+n+1], data[i+n+2], data[i+n+3]]) );
      player.y += player.vertices[n/VERTEX_SIZE].y = bytesToInt( new Uint8Array([data[i+n+4], data[i+n+5], data[i+n+6], data[i+n+7]]) );
    }
    player.x /= player.vertices.length; // Find the average
    player.y /= player.vertices.length;

    player.hand = bytesToInt( new Uint8Array([data[i+n], data[i+n+1], data[i+n+2], data[i+n+3]]) );

    players.push(player);

    if(i === 1) {
      cam.x = player.x;
      cam.y = player.y;
    }
  }
}

// Converts a 4 byte uint8array to an integer
function bytesToInt(b){
  return b[3] + 256*b[2] + 65536*b[1] + 16777216*b[0] - 2147483648;
}
