const fs = require('fs');

const Player = require('../constructors/Player');
const distance = require('../util/distance');
const insideRect = require('../util/insideRect');
const isAlphaNumeric = require('../util/isAlphaNumeric');
const ReLU = require('../util/ReLU');

const io = module.exports = {
  httpHandle: (req, res, dirname) => {
    if(req.url === '/') {
      res.sendFile(dirname + '/client/index.html');
    } else if(req.url.startsWith('/img')) {
      fs.access(dirname + '/client' + req.url, err => {
        if(err) {
          res.sendFile(dirname + '/client/img/notexture.png'); // 404 -> No texture image
        } else {
          res.sendFile(dirname + '/client' + req.url);
        }
      });
    } else {
      res.sendFile(dirname + '/client' + req.url);
    }
  },

  // Called when a client establishes a new connection
  wsConnection: (ws, Game) => {
    const playerId = Game.players.length; // The player's id is its index
    let player = new Player(playerId, ws, Game.world, Game.loot, Game.SHIELD_MILLIS);
    Game.players.push(player);
    console.log("New client, id: %d", playerId);

    ws.on('message', packet => {
      if(Game.DEBUG.PING > 0) {
        setTimeout(() => {
          io.wsMessage(ws, Game, player, packet);
        }, Game.DEBUG.PING / 2);
      } else {
        io.wsMessage(ws, Game, player, packet);
      }
    });

    ws.on('close', () => {
      io.wsClose(player);
    });

    io.sendMapData(ws, Game.map, Game.WATER_HEIGHT); // Send map data
  },

  // Called when server recieves a websocket packet
  wsMessage: (ws, Game, p, packet) => {
    if(!p.alive) return 1;

    const data = new Uint8Array(packet);
    switch(data[0]){
      case 0: // Ping
        io.pong(ws);
        break;
      case 1: // Keyboard Input
        io.setKeyboard(ws, p, packet.slice(1));
        break;
      case 2: // Request Map Data
        io.sendMapData(ws, Game.map);
        break;
      case 3: // Buy Item
        io.buyItem(ws, Game.map.shops, p, packet[1], packet[2]);
        break;
      case 4: // Set name
        switch(io.setName(ws, Game.players, p, packet.slice(1))) {
          case 0:
            p.spawn();
            break;
          case 1:
            io.sendError(ws, "Name already taken");
            break;
          case 2:
            io.sendError(ws, "Invalid Name");
            break;
        }
        break;
    }
  },

  wsClose: (player) => {
    player.connected = false;
  },

  update: (Game) => {
    // Remove deleted objects
    for(var i in Game.players)
      if(Game.players[i].isDeleted())
        delete Game.players[i];
    for(var i in Game.bullets)
      if(Game.bullets[i].deleted)
        delete Game.bullets[i];
    for(var i in Game.throwables)
      if(Game.throwables[i].deleted)
        delete Game.throwables[i];
    for(var i in Game.loot)
      if(Game.loot[i].deleted)
        delete Game.loot[i];

    // Send all players the player data
    for(var i in Game.players){
      const p = Game.players[i];
      if(p.connected && !p.choosingName) {
        io.sendGameData(Game, p);
      }
    }

    // Save all player variables
    for(var i in Game.players) {
      const p = Game.players[i];
      if(p.connected && !p.choosingName) {
        p.lastX = p.body.position.x;
        p.lastY = p.body.position.y;
        p.lastHand = p.hand;
        p.lastShield = p.shield;
        p.lastWeapon = p.getItem().id;
        p.lastJetpack = p.jetpack.jetpackId;
        p.lastFlame = p.keyboard.jump;

        p.lastKills = p.kills;
        p.lastGold = Math.floor(p.gold);
        p.lastScore = p.score;
        p.lastBullets = p.bullets;
        p.lastShells = p.shells;
        p.lastScope = p.scope.id;
        p.lastVisibility = p.getVisibility();

        p.lastHealth = p.health;
        p.lastHealing = p.healing;
        p.lastEnergy = p.energy;
        p.lastReloadProgress = p.reloadProgress;

        p.lastInventory = [];
        for(var i = 0; i < p.inventory.items.length; i++) {
          p.lastInventory.push({
            amt: p.inventory.amt[i],
            id: p.inventory.items[i].id,
            magazine: p.inventory.items[i].magazine
          })
        }
      }
    }
  },

  setKeyboard: (ws, player, packet) => { // 1 - Update keyboard
    // Sticky buttons only reset on physics update, not in io
    let stickyButtons = ["throw", "consume", "select", "drop", "loot", "reload"]
    for(var i in player.keyboard) {
      if(stickyButtons.indexOf(i) === -1) {
        player.keyboard[i] = false;
      }
    }

    let ref = {i:0}; // We want to pass i by reference so readByte can increment it

    player.hand = readByte(packet, ref);
    if(readByte(packet, ref)) player.keyboard.left = true;
    if(readByte(packet, ref)) player.keyboard.right = true;
    if(readByte(packet, ref)) player.keyboard.jump = true;
    if(readByte(packet, ref)) player.keyboard.shoot = true;
    if(readByte(packet, ref)) player.keyboard.select = true;
    if(readByte(packet, ref)) player.keyboard.drop = true;
    if(readByte(packet, ref)) player.keyboard.loot = true;
    if(readByte(packet, ref)) player.keyboard.reload = true;
    player.inventory.select = readByte(packet, ref);
  },

  sendMapData: (ws, map, WATER_HEIGHT) => { // Send map data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING)
      return 1;

    let mask = createMask([1, 0, 0, 0, 0, 0, 0, 0]);
    let packet = [];

    packet.push( WATER_HEIGHT );

    // Add the object to the packet
    function addObject(obj, type) {
      packet.push( objTypeToId(type) );
      packet.push( obj.length );
      for(var i in obj){
        packet.push( obj[i].x );
        packet.push( obj[i].y );
      }
    }

    // Add the body to the packet
    function addShop(shop) {
      packet.push( shop.type );
      packet.push( shop.x );
      packet.push( shop.y );
      packet.push( shop.width );
      packet.push( shop.height );
    }

    // Send the outline of the map
    packet.push(map.objects.length);
    for(var i in map.objects)
      addObject(map.objects[i], map.objectTypes[i]);

    // Send the physical map (for debugging only)
    /*packet.push(map.bodies.length);
    for(var i1 in map.bodies) {
      packet.push(map.bodies[i1].vertices.length);
      for(var i2 in map.bodies[i1].vertices) {
        packet.push(map.bodies[i1].vertices[i2].x);
        packet.push(map.bodies[i1].vertices[i2].y);
      }
    }*/

    // Send all the shops
    packet.push(map.shops.length);
    for(var i in map.shops)
      addShop(map.shops[i]);

    sendArray(ws, mask, packet);

    return 0;
  },

  buyItem: (ws, shops, p, slot, amount) => {
    for(var i in shops) {
      const rect = {
        x: shops[i].x - p.radius,
        y: shops[i].y - p.radius,
        width: shops[i].width + p.radius * 2,
        height: shops[i].height + p.radius * 2
      }
      if(insideRect(p.body.position, rect)) {
        const shop = shops[i];
        if(shop.items[slot]) {
          shop.buy(p, slot, amount);
        }
      }
    }
  },

  setName: (ws, players, p, packet) => {
    var ref = {i:0};
    const name = readString(packet, ref);
    if(name.length > 15) return;
    for(var i in players) {
      if(players[i].name.toLowerCase() === name.toLowerCase()) return 1; // Check if anyone else has this name
    }
    if(name.startsWith("guest") || !isAlphaNumeric(name)) return 2; // Check if player has an invalid name
    p.name = name;

    // Give new player a list of all the players
    io.sendInitLookup(ws, players);
    for(var i in players) {
      io.sendAddLookup(players[i].ws, p);
    }

    return 0;
  },

  sendGameData: (Game, p) => { // Send player, bullets, throwable, loot, and leaderboard data
    if(p.ws.readyState === p.ws.CLOSED || p.ws.readyState === p.ws.CLOSING)
      return 1;

    const id = p.id,
          ws = p.ws;

    var players = Game.players,
        bullets = Game.bullets,
        throwables = Game.throwables,
        loot = Game.loot,
        world = Game.world;

    let mask = [0, 1, 1, 1, 1, 1, 1, 0];
    let packet = [];

    io.sendPlayerData(packet, p, players, Game.SHIELD_MILLIS);
    io.sendBulletData(packet, p, bullets);
    io.sendThrowableData(packet, p, throwables);
    io.sendLootData(packet, p, loot);
    io.sendLeaderboardData(packet, p, players);
    if(!p.isSpectating()) {
      io.sendStatsData(packet, p);
      io.sendInventory(packet, p);
    } else {
      mask = [0, 1, 1, 1, 1, 0, 0, 0];
    }
    sendArray(ws, createMask(mask), packet, Game.DEBUG.PING);
  },

  sendPlayerData: (packet, p, players, SHIELD_MILLIS) => {
    packet.push(null); // For counting players
    packet.push(p.isSpectating());
    var numPlayers = 0;
    var numPlayersIndex = packet.length - 2;

    const id = p.id;
    if(p.isSpectating()) {
      packet.push(new Short(p.body.position.x));
      packet.push(new Short(p.body.position.y));
      packet.push(p.kills);
      packet.push(p.score);
    }

    var lastVisible = p.lastVisible;
    var newLastVisibile = [];

    // Adds a player to the packet
    function addPlayer(p) {
      // Determine which variables changed and only send those
      var mask = [1, 1, 1, 1, 1, 1, 1, 0];
      if(lastVisible.includes(p.id)) {
        mask[0] = 0;
        if(Math.floor(p.lastX) === Math.floor(p.body.position.x)) mask[1] = 0;
        if(Math.floor(p.lastY) === Math.floor(p.body.position.y)) mask[2] = 0;
        if(p.lastHand === p.hand) mask[3] = 0;
        if(p.lastShield === p.shield) mask[4] = 0;
        if(p.lastWeapon === p.getItem().id) mask[5] = 0;
        if(p.lastJetpack === p.jetpack.jetpackId && p.lastFlame === p.keyboard.jump) mask[6] = 0;
      }

      packet.push( new Byte(createMask(mask)) )
      packet.push( new Short(p.id) );
      if(mask[0]) packet.push( p.name );
      if(mask[1]) packet.push( new Short(p.body.position.x) );
      if(mask[2]) packet.push( new Short(p.body.position.y) );

      if(mask[3]) packet.push( new Byte(p.hand) );
      if(mask[4]) packet.push( new Byte(255 * p.shield / SHIELD_MILLIS) );
      if(mask[5]) packet.push( new Byte(p.getItem().id) ); // The weapon player is holding
      if(mask[6]) packet.push( new Byte(p.jetpack.jetpackId) ); // Jetpack
      if(mask[6]) packet.push( p.keyboard.jump ); // The flame below the jetpack

      newLastVisibile.push(p.id); // Let the game know that this player is visible
    }

    if(p.isPlaying()) {
      addPlayer(p); // Add yourself to the player packet
      numPlayers++;
    }
    p.lastVisible = newLastVisibile;

    // Add all the other players
    for(var i in players){
      if(
        players[i].inGame() &&
        i !== String(id) &&
        distance(p.body.position, players[i].body.position) < p.getVisibility()
      ) {
        addPlayer(players[i]);
        numPlayers++;
      }
    }

    packet[numPlayersIndex] = new Byte(numPlayers);
  },

  sendStatsData: (packet, p) => {
    // Determine which variables changed and only send those
    var mask = [1, 1, 1, 1, 1, 1, 1, 0];
    if(p.kills === p.lastKills) mask[0] = 0;
    if(Math.floor(p.gold) === p.lastGold) mask[1] = 0;
    if(p.score === p.lastScore) mask[2] = 0;
    if(p.bullets === p.lastBullets) mask[3] = 0;
    if(p.shells === p.lastShells) mask[4] = 0;
    if(p.scope.id === p.lastScope) mask[5] = 0;
    if(p.getVisibility() === p.lastVisibility) mask[6] = 0;

    packet.push( new Byte(createMask(mask)) )
    if(mask[0]) packet.push( new Short(p.kills) );
    if(mask[1]) packet.push( new Short(p.gold) );
    if(mask[2]) packet.push( new Short(p.score) );
    if(mask[3]) packet.push( new Short(p.bullets) );
    if(mask[4]) packet.push( new Short(p.shells) );
    if(mask[5]) packet.push( new Byte(p.scope.id) );
    if(mask[6]) packet.push( new Short(p.getVisibility()) );
  },

  sendInventory: (packet, p) => {
    var mask = [1, 1, 1, 1, 1, 1, 1, 1];
    // I'm grouping some of these together to keep the mask down to 8 bytes
    if(p.health === p.lastHealth && p.healing === p.lastHealing) mask[6] = 0;
    if(p.energy === p.lastEnergy && p.reloadProgress === p.lastReloadProgress) mask[7] = 0;

    var maskIndex = packet.length;
    packet.push( 0 ) // Where the mask will go

    for(var i = 0; i < p.inventory.items.length; i++) {
      if(
        !p.lastInventory ||
        p.inventory.amt[i] !== p.lastInventory[i].amt ||
        p.inventory.items[i].id !== p.lastInventory[i].id ||
        p.inventory.items[i].magazine !== p.lastInventory[i].magazine
      ) {
        packet.push( new Byte(p.inventory.amt[i]) );
        packet.push( new Byte(p.inventory.items[i].id) );
        packet.push( new Byte(p.inventory.items[i].magazine) );
      } else {
        mask[5-i] = 0;
      }
    }
    if(mask[6]) {
      packet.push( new Byte(Math.floor(p.health * 255)) );
      packet.push( p.healing );
    }
    if(mask[7]) {
      packet.push( new Byte(Math.floor(ReLU(p.energy) * 255)) );
      packet.push( new Byte(Math.floor(p.reloadProgress * 255)) );
    }

    packet[maskIndex] = new Byte(createMask(mask)); // Put the mask in
  },

  sendBulletData: (packet, p, bullets) => {
    packet.push(0); // Number of bullets
    var numBullets = 0;
    var numBulletsIndex = packet.length - 1;

    function addBullet(b) {
      packet.push( new Byte(b.type) );
      packet.push( new Short(b.body.position.x) );
      packet.push( new Short(b.body.position.y) );
      packet.push( new Byte(b.angle) );
    }

    for(var i in bullets){
      if(
        !bullets[i].deleted &&
        distance(p.body.position, bullets[i].body.position) < p.getVisibility()
      ) {
        addBullet(bullets[i]); // Add the bullets
        numBullets++; // Count the bullets
      }
    }

    packet[numBulletsIndex] = numBullets;
  },

  sendThrowableData: (packet, p, throwables) => {
    packet.push(0); // Number of throwables
    var numThrowables = 0;
    var numThrowablesIndex = packet.length - 1;

    function addThrowable(t) {
      packet.push( new Short(t.body.position.x) );
      packet.push( new Short(t.body.position.y) );
      packet.push( new Byte(Math.floor(255*(t.body.angle % (Math.PI*2)) / (Math.PI*2))) );
    }

    for(var i in throwables){
      if(
        !throwables[i].deleted &&
        distance(p.body.position, throwables[i].body.position) < p.getVisibility()
      ) {
        addThrowable(throwables[i]); // Add the throwables
        numThrowables++; // Count the throwables
      }
    }

    packet[numThrowablesIndex] = numThrowables;
  },

  sendLootData: (packet, p, loot) => {
    packet.push(0); // Number of Loot
    var numLoot = 0;
    var numLootIndex = packet.length - 1;

    // Adds a loot object to the packet
    function gimmeTheLoot(l) {
      packet.push( new Byte(l.item.id) );
      packet.push( new Short(l.body.position.x) );
      packet.push( new Short(l.body.position.y) );
      packet.push( new Byte(Math.floor(255*(l.body.angle % (Math.PI*2)) / (Math.PI*2))) );
    }

    for(var i in loot){
      if(
        !loot[i].deleted &&
        distance(p.body.position, loot[i].body.position) < p.getVisibility()
      ) {
        gimmeTheLoot(loot[i]); // Gimme the loot!
        numLoot++; // Count the loot
      }
    }

    packet[numLootIndex] = numLoot;
  },

  sendLeaderboardData: (packet, p, players, leaderboard) => {
    var leaderboard = [];
    for(var i1 in players){
      if(!players[i1].inGame()) continue;
      var i2 = leaderboard.findIndex(player => {
        return player.score > players[i1].score;
      });
      if(i2 !== -1) {
        leaderboard.splice(i2, 0, players[i1]);
      } else {
        leaderboard.push(players[i1]);
      }
    }
    packet.push(Math.min(10, leaderboard.length)); // Leaderboard Size
    for(var i = Math.min(10, leaderboard.length)-1; i >= 0; i--) {
      packet.push(new Short(leaderboard[i].id));
      packet.push(new Short(leaderboard[i].score));
    }
  },

  sendShopMenu: (p, shop) => {
    let packet = [new Byte(0), new Byte(shop.type)];
    for(var i in shop.items) {
      packet.push(new Byte(shop.items[i].id));
      packet.push(shop.items[i].price);
    }

    var mask = createMask([0, 0, 0, 0, 0, 0, 0, 1]);
    sendArray(p.ws, mask, packet);
  },

  sendError: (ws, error) => {
    var mask = createMask([0, 0, 0, 0, 0, 0, 0, 1]);
    sendArray(ws, mask, [new Byte(1), error]);
    ws.player.alive = false;
    ws.close();
  },

  sendInitLookup: (ws, players) => {
    var packet = [new Byte(2)];
    var mask = createMask([0, 0, 0, 0, 0, 0, 0, 1]);
    var numPlayers = 0;
    var numPlayerIndex = packet.length;
    packet.push(0);

    for(var i in players) {
      packet.push(new Short(players[i].id));
      packet.push(players[i].name);
      numPlayers++;
    }
    packet[numPlayerIndex] = new Short(numPlayers);

    if(ws.readyState === ws.OPEN) {
      sendArray(ws, mask, packet);
    }
  },

  sendAddLookup: (ws, player) => {
    var packet = [new Byte(3)];
    var mask = createMask([0, 0, 0, 0, 0, 0, 0, 1]);

    packet.push(new Short(player.id));
    packet.push(player.name);

    if(ws.readyState === ws.OPEN) {
      sendArray(ws, mask, packet);
    }
  },

  sendRemoveLookup: (ws, player) => {
    var packet = [new Byte(4)];
    var mask = createMask([0, 0, 0, 0, 0, 0, 0, 1]);

    packet.push(new Short(player.id));

    if(ws.readyState === ws.OPEN) {
      sendArray(ws, mask, packet);
    }
  }
}

// Converts an array of ints to bytes and sends it
function sendArray(ws, mask, packet, DEBUG_PING) {
  for(var i in packet) {
    switch(typeof packet[i]){
      case "number":
        packet[i] = Buffer.from( intToBytes(packet[i]) );
        break;
      case "object":
        if(packet[i] instanceof Byte) {
          packet[i] = Buffer.from( new Uint8Array([packet[i].num]) );
        } else if(packet[i] instanceof Short) {
          packet[i] = Buffer.from(shortToBytes(packet[i].num));
        }
        break;
      case "string":
        packet[i] = Buffer.from( strToBytes(packet[i]) );
        break;
      case "boolean":
        packet[i] = Buffer.from( new Uint8Array([packet[i] ? 1 : 0]) );
        break;
    }
  }

  packet = Buffer.concat( packet );
  mask = Buffer.from(new Uint8Array([mask]));
  if(DEBUG_PING > 0) {
    setTimeout(() => {
      ws.send(Buffer.concat( [mask, packet] ));
    }, DEBUG_PING / 2);
  } else {
    ws.send(Buffer.concat( [mask, packet] ));
  }
}

// 1 byte integer
function Byte(num) {
  this.num = num;
}

// 2 byte integer
function Short(num) {
  this.num = num;
}

function createMask(binArr) {
  var mask = 0;
  for(var i = 0; i < binArr.length; i++) {
    mask += binArr[binArr.length - i - 1] * Math.pow(2, i);
  }
  return mask;
}

function objTypeToId(type) {
  switch(type) {
    case "solid":
      var id = 0;
      break;
    case "safezone":
      var id = 1;
      break;
    default:
      var id = 0;
      break;
  }
  return id;
}

// Reads a one byte integer from an index in a byte array
function readByte(a, ref) {
  return a[ref.i++];
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

// Converts an integer into a unit8array
function intToBytes(n){
  n += 2147483648;

  let bytes = new Uint8Array(4);
  bytes[0] = Math.floor(n / 16777216);
  bytes[1] = Math.floor(n / 65536);
  bytes[2] = Math.floor(n / 256);
  bytes[3] = Math.floor(n % 256);
  return new Uint8Array(bytes);
}

// Converts a 2 byte short into a unit8array
function shortToBytes(n){
  n += 32768;

  let bytes = new Uint8Array(2);
  bytes[0] = Math.floor(n / 256);
  bytes[1] = Math.floor(n % 256);
  return new Uint8Array(bytes);
}

// Converts a 2 byte unsigned short into a unit8array
function UshortToBytes(n){
  return shortToBytes(n - 32768);
}
