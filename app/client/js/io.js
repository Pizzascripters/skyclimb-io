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
    document.getElementById("error").innerText = "";
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
    document.getElementById("deathscreen").style.visibility = "hidden";
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
  packet.push(keyboard.reload);
  packet.push(select);
  ws.send( new Uint8Array(packet) );

  keyboard.throw = false;
  keyboard.consume = false;
  keyboard.select = false;
  keyboard.loot = false;
  keyboard.drop = false;
  keyboard.reload = false;
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

  var ref = {i: 0}; // We want to pass i by reference to readInt can increment it
  var mask = readByte(data, ref);
  if(mask & 128) { // Map
    setMap(data, ref, Game.map);
    Game.map.objects.forEach(obj => {
      createSurfaces(obj.vertices);
    });
    genDecoration(Game.images, Game.map);
  }
  if(mask & 64) { // Players
    setPlayers(data, ref, Game);
  }
  if(mask & 32) { // Linear Objects (bullets)
    setBullets(data, ref, Game.bullets, Game.images);
  }
  if(mask & 16) { // Parabolic Objects (objects affected by gravity)
    setThrowables(data, ref, Game.throwables, Game.images.nade);
    setLoot(data, ref, Game.loot, Game.items);
  }
  if(mask & 8) { // Leaderboard
    setLeaderboard(data, ref, Game.leaderboard);
  }
  if(mask & 4) { // Stats
    setStats(data, ref, Game.players[0]);
  }
  if(mask & 2) { // Inventory
    setInventory(data, ref, Game.players[0], Game.inventory);
  }
  if(mask & 1) { // Shop Menu or Error
    switch(readByte(data, ref)) {
      case 0:
        shopMenu(data, ref, Game.shopMenu, Game.items);
        Game.keyboard.left = false;
        Game.keyboard.right = false;
        Game.keyboard.jump = false;
        break;
      case 1:
        error(data, ref);
        break;
      case 2:
        initLookup(data, ref, Game.lookup);
        break;
      case 3:
        addLookup(data, ref, Game.lookup);
        break;
      case 4:
        removeLookup(data, ref, Game.lookup);
        break;
    }
  }
}

// Called when client recieves map data
function setMap(data, ref, map){
  // Clear out the map to load in a new one
  for(var i in map)
    delete map[i];

  map.waterHeight = readInt(data, ref);

  map.objects = [];
  const numObjects = readInt(data, ref);
  while(map.objects.length < numObjects){
    let object = {};
    object.type = typeIdToName( readInt(data, ref) );
    const numVertices = readInt(data, ref);
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
function setPlayers(data, ref, Game){
  let players = Game.players,
      images = Game.images,
      inventory = Game.inventory,
      items = Game.items,
      bullets = Game.bullets,
      throwables = Game.throwables,
      loot = Game.loot,
      leaderboard = Game.leaderboard,
      cam = Game.cam;

  let numPlayers = readByte(data, ref);
  Game.spectating = readBool(data, ref);

  if(Game.spectating) {
    cam.x = readShort(data, ref);
    cam.y = readShort(data, ref);
    Game.deathscreen.kills = readInt(data, ref);
    Game.deathscreen.score = readInt(data, ref);
    Game.deathscreen.show();
  }

  for(var i in players) {
    players[i].inGame = false; // Set to false until server tells us that the player is in the game
  }
  for(var i = 0; i < numPlayers; i++){
    var player = {};
    var exists = false; // Exists is true if client already knows about the player
    var mask = readByte(data, ref);
    player.id = readShort(data, ref);
    players.forEach(p => {
      if(p.id === player.id) {
        player = p;
        exists = true;
      }
    });
    if(!exists) players.push(player);
    player.inGame = true;
    if(mask & 128) player.name = readString(data, ref);

    if(mask & 64) player.x = readShort(data, ref);
    if(mask & 32) player.y = readShort(data, ref);
    player.radius = PLAYER_RADIUS;

    if(mask & 16) player.hand = readByte(data, ref);
    if(mask & 8) player.shield = readByte(data, ref);
    if(mask & 4) player.weapon = readByte(data, ref);

    if(mask & 2) {
      var jetpackId = readByte(data, ref);
      if(player.jetpack === undefined || player.jetpack.id !== jetpackId) {
        player.jetpack = createJetpack(Game.images.jetpacks, jetpackId);
      }
      if(readBool(data, ref)) {
        if(!player.jetpack.flame) {
          player.jetpack.on();
        }
      } else {
        player.jetpack.off();
      }
    }

    if(i === 0 && !Game.spectating) {
      cam.x = player.x;
      cam.y = player.y;
    }
  }

  // Delete the players that aren't in the game
  for(var i in players) {
    if(!players[i].inGame) {
      players.splice(i, 1);
    }
  }
}

function setStats(data, ref, player) {
  var mask = readByte(data, ref);

  if(mask & 128) player.kills = readShort(data, ref);
  if(mask & 64) player.gold = readShort(data, ref);
  if(mask & 32) player.score = readShort(data, ref);
  if(mask & 16) player.bullets = readShort(data, ref);
  if(mask & 8) player.shells = readShort(data, ref);
  if(mask & 4) player.scope = readByte(data, ref);
  if(mask & 2) anim.startVisiblityAnimation(readShort(data, ref));
}

function setInventory(data, ref, player, inventory) {
  var mask = readByte(data, ref);

  for(var i = 0; i < inventory.items.length; i++) {
    if(mask & Math.pow(2, i+2)) {
      inventory.amt[i] = readByte(data, ref);
      inventory.items[i] = readByte(data, ref);
      inventory.magazine[i] = readByte(data, ref);
    }
  }

  if(mask & 2) {
    player.health = readByte(data, ref) / 255;
    player.healing = readBool(data, ref);
  }
  if(mask & 1) {
    player.energy = readByte(data, ref) / 255;
    player.reloadProgress = readByte(data, ref) / 255;
  }
}

function setBullets(data, ref, bullets, images) {
  bullets.splice(0, bullets.length);
  let numBullets = readInt(data, ref);

  // Load the bullets
  while(bullets.length < numBullets){
    let bullet = {};
    bullet.type = readByte(data, ref);
    bullet.x = readShort(data, ref);
    bullet.y = readShort(data, ref);
    bullet.angle = readByte(data, ref);
    bullets.push(bullet);

    if(bullet.type === 0){
      bullet.image = images.bullets.bullet;
    } else if(bullet.type === 1) {
      bullet.image = images.shrapnel[Math.floor(Math.random() * 3) + 1];
    } else if(bullet.type === 2) {
      bullet.image = images.bullets.pellet;
    }
  }
}

function setThrowables(data, ref, throwables) {
  throwables.splice(0, throwables.length);
  let numThrowables = readInt(data, ref);

  // Load the throwables
  while(throwables.length < numThrowables){
    let throwable = {};
    throwable.x = readShort(data, ref);
    throwable.y = readShort(data, ref);
    throwable.angle = readByte(data, ref);
    throwable.width = 40;
    throwable.height = 40;
    throwables.push(throwable);
  }
}

function setLoot(data, ref, loot, items) {
  loot.splice(0, loot.length);
  let numLoot = readInt(data, ref);

  // Gimme the loot!
  while(loot.length < numLoot){
    let l = {};
    l.item = items[readByte(data, ref)];
    l.x = readShort(data, ref);
    l.y = readShort(data, ref);
    l.radius = LOOT_RADIUS;
    l.angle = readByte(data, ref);
    loot.push(l);
  }
}

function setLeaderboard(data, ref, leaderboard) {
  leaderboard.splice(0, leaderboard.length);
  let leaderboardSize = readInt(data, ref);

  // Leaderboard
  while(leaderboard.length < leaderboardSize){
    let l = {};
    l.id = readShort(data, ref);
    l.score = readShort(data, ref);
    leaderboard.push(l);
  }
}

function shopMenu(data, ref, menu, items){
  menu.splice(0, menu.length);
  while(data[ref.i]) {
    if(ref.i === 2) {
      menu.push(shopIdToName(readByte(data, ref)));
    } else {
      let item = items[readByte(data, ref)];
      item.price = readInt(data, ref);
      menu.push(item);
    }
  }
}

function error(data, ref){
  const err = readString(data, ref);
  document.getElementById("error").innerText = err;
}

function initLookup(data, ref, lookup) {
  const numPlayers = readShort(data, ref);
  for(var i = 0; i < numPlayers; i++) {
    addLookup(data, ref, lookup);
  }
}

function addLookup(data, ref, lookup) {
  const id = readShort(data, ref);
  const name = readString(data, ref);
  lookup[id] = name;
}

function removeLookup(data, ref, lookup) {
  const id = readShort(data, ref);
  delete lookup[id];
}

// Requests the map data in case we didn't get it
function requestMapData(ws){
  if(ws.readyState != ws.OPEN)
    return 1;

  ws.send(new Uint8Array(2));
}

function shopIdToName(id) {
  switch(id) {
    case 1:
      return "generic";
      break;
    case 2:
      return "golden";
      break;
  }
}

function typeIdToName(id) {
  switch(id) {
    case 0:
      return "solid";
      break;
    case 1:
      return "safezone";
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

// Reads a two byte unsigned integer from an index in a byte array
function readShort(a, ref) {
  let b1 = a[ref.i];
  let b2 = a[ref.i+1];
  ref.i += 2;
  return bytesToInt([0, 0, b1, b2]) + 2147483648 - 32768;
}

// Reads a one byte integer from an index in a byte array
function readByte(a, ref) {
  return a[ref.i++];
}

// Reads a one byte boolean from an index in a byte array
function readBool(a, ref) {
  let x = a[ref.i];
  ref.i++;
  return x ? true : false;
}


// Reads a string from an index in a byte array
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
