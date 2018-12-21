function createWebsocket(Game) {
  const sendKeyboardInterval = setInterval(() => {
    sendKeyboard(Game.ws, Game.keyboard, Game.inventory.select, Game.hand);
  }, 1000 / 60);

  let ws;
  if( window.location.href.startsWith("https") ) {
    ws = new WebSocket("wss://" + window.location.href.substring(6));
  } else {
    ws = new WebSocket("ws://" + window.location.href.substring(5));
  }
  ws.binaryType = "arraybuffer"; // Allows us to recieve byte strings from the server

  ws.onmessage = (packet) => {
    handleMessage(packet, Game);
  };
  ws.onclose = () => {
    console.error("Socket closed");
    clearInterval(sendKeyboardInterval);
  };

  return ws;
}

// Given a packet, reads the first byte, sends it to a more specific function
function handleMessage(packet, Game){
  var data = new Uint8Array(packet.data);

  switch(data[0]){
    case 0: // Ping
      pong(packet);
      break;
    case 1: // Map data
      setMap(new Uint8Array(packet.data), Game.map);
      break;
    case 2: // Player data
      setPlayers(new Uint8Array(packet.data), Game.players, Game.inventory, Game.bullets, Game.throwables, Game.cam);
      break;
    case 3: // Shop data
      shopMenu(new Uint8Array(packet.data), Game.shopMenu);
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
function sendKeyboard(ws, keyboard, select, hand){
  if(ws.readyState != ws.OPEN)
    return 1;

  let packet = [];
  packet.push(1);
  packet.push(hand);
  packet.push(keyboard.left);
  packet.push(keyboard.right);
  packet.push(keyboard.jump);
  packet.push(keyboard.shoot);
  packet.push(keyboard.throw);
  packet.push(keyboard.consume);
  packet.push(keyboard.select);
  packet.push(select);
  ws.send( new Uint8Array(packet) );

  keyboard.throw = false;
  keyboard.consume = false;
  keyboard.select = false;
}

// Requests the map data in case we didn't get it
function requestMapData(ws){
  if(ws.readyState != ws.OPEN)
    return 1;

  ws.send(new Uint8Array(2));
}

// Called when client recieves pong packet
function pong(packet){
  console.log("Ping to %s took " + Math.round(window.performance.now() - pingStart) + " ms", packet.origin);
}

// Called when client recieves map data
function setMap(data, map){
  for(var i in map)
    delete map[i];

  let ref = {i:1}; // We want to pass i by reference to readInt can increment it

  map.objects = [];
  const numObjects = readInt(data, ref);
  var count = 0;
  while(count < numObjects){
    const numVertices = readInt(data, ref);

    let object = {};
    object.vertices = [];
    for(var n = 0; n < numVertices; n++) {
      object.vertices[n] = {};
      object.vertices[n].x = readInt(data, ref);
      object.vertices[n].y = readInt(data, ref);
    }

    map.objects.push(object);
    count++;
  }

  map.shops = [];
  const numShops = readInt(data, ref);
  count = 0;
  while(count < numShops) {
    let shop = {};
    switch(readInt(data, ref)) {
      default:
        shop.type = "generic";
        break;
    }
    shop.x = readInt(data, ref);
    shop.y = readInt(data, ref);
    shop.width = readInt(data, ref);
    shop.height = readInt(data, ref);

    map.shops.push(shop);
    count++;
  }
}

// Called when client recieves player information
function setPlayers(data, players, inventory, bullets, throwables, cam){
  // Clear the arrays
  players.splice(0, players.length);
  bullets.splice(0, bullets.length);
  throwables.splice(0, throwables.length);

  let ref = {i:1}; // We want to pass i by reference to readInt can increment it

  let numPlayers = readInt(data, ref);
  let numBullets = readInt(data, ref);
  let numThrowables = readInt(data, ref);

  while(players.length < numPlayers){
    var player = {};
    player.x = readInt(data, ref);
    player.y = readInt(data, ref);
    player.radius = readInt(data, ref);

    player.hand = readInt(data, ref);
    player.health = readInt(data, ref) / 255;
    player.energy = readInt(data, ref) / 255;
    player.weapon = readInt(data, ref);

    if(players.length === 0) {
      // Inventory
      for(var i = 0; i < inventory.items.length; i++) {
        if(i === 0 || i === 1)
          inventory.amt[i] = readInt(data, ref);
        inventory.items[i] = readInt(data, ref);
      }

      player.kills = readInt(data, ref);
      player.gold = readInt(data, ref);
      player.score = readInt(data, ref);
    }

    players.push(player);

    if(players.length === 1) {
      cam.x = player.x;
      cam.y = player.y;
    }
  }

  while(bullets.length < numBullets){
    let bullet = {};
    bullet.vertices = [];
    for(var n = 0; n < VERTICES_PER_BULLET; n++) {
      bullet.vertices[n] = {};
      bullet.vertices[n].x = readInt(data, ref);
      bullet.vertices[n].y = readInt(data, ref);
    }

    bullet.angle = readInt(data, ref);

    bullets.push(bullet);
  }

  while(throwables.length < numThrowables){
    let throwable = {};
    throwable.vertices = [];
    throwable.vertices[n] = {};
    throwable.x = readInt(data, ref);
    throwable.y = readInt(data, ref);
    throwable.angle = readInt(data, ref);
    throwable.width = 30;
    throwable.height = 30;

    throwables.push(throwable);
  }
}

function shopMenu(data, menu){
  menu.splice(0, menu.length);
  var ref = {i: 1}; // We want to pass i by reference to readInt can increment it
  while(data[ref.i]) {
    menu.push(readInt(data, ref));
  }
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
