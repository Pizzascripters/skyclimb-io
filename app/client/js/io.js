function createWebsocket(Game) {
  const sendKeyboardInterval = setInterval(() => {
    sendKeyboard(ws, Game.keyboard, Game.inventory.select, Game.hand);
  }, 1000 / 60);

  if( window.location.href.startsWith("https") ) {
    var ws = new WebSocket("wss://" + window.location.href.substring(6));
  } else {
    var ws = new WebSocket("ws://" + window.location.href.substring(5));
  }
  ws.binaryType = "arraybuffer"; // Allows us to recieve byte strings from the server

  ws.onopen = () => {
    sendName(ws, document.getElementById("name").value);
  }
  ws.onmessage = packet => {
    handleMessage(packet, Game);
  };
  ws.onclose = () => {
    console.error("Socket closed");
    clearInterval(sendKeyboardInterval);
    cvs.hidden = true;
    document.getElementById("startmenu").style.visibility = "visible";
  };
  return ws;
}

function sendName(ws, name) {
  if(ws.readyState != ws.OPEN)
    return 1;

  let packet = [];
  packet.push(4);
  let bytes = strToBytes(name);
  for(var i in bytes) packet.push(bytes[i]);
  ws.send( new Uint8Array(packet) );
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
  packet.push(keyboard.select);
  packet.push(keyboard.drop);
  packet.push(keyboard.loot);
  packet.push(select);
  ws.send( new Uint8Array(packet) );

  keyboard.throw = false;
  keyboard.consume = false;
  keyboard.select = false;
  keyboard.loot = false;
  keyboard.drop = false;
}

function buyItem(ws, slot, amount) {
  if(ws.readyState != ws.OPEN)
    return 1;

  let packet = [];
  packet.push(3);
  packet.push(slot);
  packet.push(amount);
  ws.send( new Uint8Array(packet) );
}

// Given a packet, reads the first byte, sends it to a more specific function
function handleMessage(packet, Game){
  var data = new Uint8Array(packet.data);

  switch(data[0]){
    case 0: // Ping
      pong(packet.origin);
      break;
    case 1: // Map data
      setMap(data, Game.map);
      break;
    case 2: // Player data
      setPlayers(data, Game);
      break;
    case 3: // Shop data
      shopMenu(data, Game.shopMenu, Game.items);
      break;
  }
}

// Called when client recieves map data
function setMap(data, map){
  // Clear out the map to load in a new one
  for(var i in map)
    delete map[i];

  let ref = {i:1}; // We want to pass i by reference to readInt can increment it

  map.waterHeight = readInt(data, ref);

  map.objects = [];
  const numObjects = readInt(data, ref);
  while(map.objects.length < numObjects){
    const numVertices = readInt(data, ref);
    let object = {};
    object.vertices = [];
    for(var i = 0; i < numVertices; i++) {
      object.vertices[i] = {};
      object.vertices[i].x = readInt(data, ref);
      object.vertices[i].y = readInt(data, ref);
    }
    map.objects.push(object);
  }

  map.shops = [];
  const numShops = readInt(data, ref);
  while(map.shops.length < numShops) {
    let shop = {};
    shop.type = shopIdToName(readInt(data, ref));
    shop.x = readInt(data, ref);
    shop.y = readInt(data, ref);
    shop.width = readInt(data, ref);
    shop.height = readInt(data, ref);
    map.shops.push(shop);
  }
}

// Called when client recieves player information
function setPlayers(data, Game){
  let players = Game.players,
      images = Game.images,
      inventory = Game.inventory,
      items = Game.items,
      bullets = Game.bullets,
      throwables = Game.throwables,
      loot = Game.loot,
      cam = Game.cam;

  // Clear the arrays
  players.splice(0, players.length);
  bullets.splice(0, bullets.length);
  throwables.splice(0, throwables.length);
  loot.splice(0, loot.length);

  let ref = {i:1}; // We want to pass i by reference to readInt can increment it

  let numPlayers = readInt(data, ref);
  let numBullets = readInt(data, ref);
  let numThrowables = readInt(data, ref);
  let numLoot = readInt(data, ref);

  while(players.length < numPlayers){
    var player = {};
    player.name = readString(data, ref);
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
      player.bullets = readInt(data, ref);
      player.shells = readInt(data, ref);
    }

    players.push(player);

    if(players.length === 1) { // If we're loading yourself
      cam.x = player.x;
      cam.y = player.y;
    }
  }

  // Load the bullets
  while(bullets.length < numBullets){
    let bullet = {};
    bullet.type = readInt(data, ref);
    bullet.x = readInt(data, ref);
    bullet.y = readInt(data, ref);
    bullet.angle = readInt(data, ref);
    bullets.push(bullet);

    if(bullet.type === 0){
      bullet.image = images.bullets.bullet;
    } else if(bullet.type === 1) {
      bullet.image = images.shrapnel[Math.floor(Math.random() * 3) + 1];
    } else if(bullet.type === 2) {
      bullet.image = images.bullets.pellet;
    }
  }

  // Load the throwables
  while(throwables.length < numThrowables){
    let throwable = {};
    throwable.x = readInt(data, ref);
    throwable.y = readInt(data, ref);
    throwable.angle = readInt(data, ref);
    throwable.width = 30;
    throwable.height = 30;
    throwables.push(throwable);
  }

  // Gimme the loot!
  while(loot.length < numLoot){
    let l = {};
    l.item = items[readInt(data, ref)];
    l.x = readInt(data, ref);
    l.y = readInt(data, ref);
    l.radius = readInt(data, ref);
    l.angle = readInt(data, ref);
    loot.push(l);
  }
}

function shopMenu(data, menu, items){
  menu.splice(0, menu.length);
  var ref = {i: 1}; // We want to pass i by reference to readInt can increment it
  while(data[ref.i]) {
    if(ref.i === 1) {
      menu.push(shopIdToName(readInt(data, ref)));
    } else {
      let item = items[readInt(data, ref)];
      item.price = readInt(data, ref);
      menu.push(item);
    }
  }
}

// Sends a 1 byte packet to the server
function ping(ws){
  if(ws.readyState != ws.OPEN)
    return 1;

  pingStart = window.performance.now();
  ws.send(new Uint8Array(1));
}

// Called when client recieves pong packet
function pong(origin){
  console.log("Ping to %s took " + Math.round(window.performance.now() - pingStart) + " ms", origin);
}

// Requests the map data in case we didn't get it
function requestMapData(ws){
  if(ws.readyState != ws.OPEN)
    return 1;

  ws.send(new Uint8Array(2));
}

function shopIdToName(id) {
  switch(id) {
    default:
      return "generic";
      break;
  }
}

// Reads a four byte integer from an index in a byte array
function readInt(a, ref) {
  let b1 = a[ref.i];
  let b2 = a[ref.i+1];
  let b3 = a[ref.i+2];
  let b4 = a[ref.i+3];
  ref.i += 4;
  return bytesToInt([b1, b2, b3, b4]);
}

// Reads a string from an intex in a byte array
function readString(a, ref){
  var str = "";
  while(a[ref.i++] !== 0)
    str += String.fromCharCode(a[ref.i-1]);
  return str;
}

// Converts a string to a uint8array
function strToBytes(str){
  let bytes = [];
  for(var i = 0; i < str.length; i++){
    bytes.push(str.charCodeAt(i));
  }
  bytes.push(0);
  return new Uint8Array(bytes);
}

// Converts a 4 byte uint8array to an integer
function bytesToInt(b){
  return b[3] + 256*b[2] + 65536*b[1] + 16777216*b[0] - 2147483648;
}
