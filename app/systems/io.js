const fs = require('fs');

const Player = require('../constructors/Player');
const distance = require('../util/distance');
const insideRect = require('../util/insideRect');
const isAlphaNumeric = require('../util/isAlphaNumeric');

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
    let player = new Player(playerId, ws, Game.world);
    Game.players.push(player);
    console.log("New client, id: %d", playerId);

    ws.on('message', packet => {
      io.wsMessage(ws, Game, player, packet);
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
      if(p.connected && !p.choosingName)
        io.sendGameData(Game, p);
    }
  },

  /*  The following functions send a packet to the client
      Each has a 1 byte header to identify its purpose */

  pong: (ws) => { // 0 - Return ping
    if(ws.readyState === ws.CLOSED)
      return 1;

    const header = Buffer.from( new Uint8Array([0]) );
    ws.send(header);

    return 0;
  },

  setKeyboard: (ws, player, packet) => { // 1 - Update keyboard
    // Sticky buttons only reset on physics update, not in io
    let stickyButtons = ["throw", "consume", "select", "drop", "loot"]
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
    player.inventory.select = readByte(packet, ref);
  },

  sendMapData: (ws, map, WATER_HEIGHT) => { // Send map data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING)
      return 1;

    // 1 byte header
    const header = Buffer.from( new Uint8Array([1]) );
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

    sendArray(ws, header, packet);

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
          shop.items[slot].buy(p, amount);
        }
      }
    }
  },

  setName: (ws, players, p, packet) => {
    var ref = {i:0};
    const name = readString(packet, ref);
    for(var i in players) {
      if(players[i].name.toLowerCase() === name.toLowerCase()) return 1; // Check if anyone else has this name
    }
    if(name.startsWith("guest") || !isAlphaNumeric(name)) return 2; // Check if player has an invalid name
    p.name = name;
    return 0;
  },

  sendGameData: (Game, p) => { // Send player and bullet data
    if(p.ws.readyState === p.ws.CLOSED || p.ws.readyState === p.ws.CLOSING)
      return 1;

    const id = p.id,
          ws = p.ws;

    var players = Game.players,
        bullets = Game.bullets,
        throwables = Game.throwables,
        loot = Game.loot,
        world = Game.world;

    // 1 byte header
    const header = Buffer.from( new Uint8Array([2]) );
    let packet = [];

    packet.push(0, 0, 0, 0, 0); // For counting players, bullets, throwables, loot, and leaderboard size
    packet.push(p.isSpectating() ? 1 : 0);

    if(p.isSpectating()) {
      packet.push(p.body.position.x);
      packet.push(p.body.position.y);
      packet.push(p.kills);
      packet.push(p.score);
    }

    // Adds a player to the packet
    function addPlayer(p) {
      const radius = distance(p.body.position, p.body.vertices[0]);
      packet.push( p.name );
      packet.push( p.body.position.x );
      packet.push( p.body.position.y );
      packet.push( radius );
      packet.push( p.hand );
      packet.push( Math.floor(p.health * 255) );
      packet.push( Math.floor(p.energy * 255) );
      packet.push( p.shield );
      packet.push( p.getItem().id ); // The weapon player is holding

      if(p.id === id) {
        // Inventory
        for(var i = 0; i < p.inventory.items.length; i++) {
          if( i === 0 || i === 1 )
            packet.push( p.inventory.amt[i] );
          packet.push( p.inventory.items[i].id );
        }

        packet.push( p.kills );
        packet.push( p.gold );
        packet.push( p.score );
        packet.push( p.bullets );
        packet.push( p.shells );

        packet.push( p.healing );
      }

      packet.push(p.keyboard.jump); // The flame below the jetpack
    }

    function addBullet(b) {
      packet.push( b.type );
      packet.push( b.body.position.x );
      packet.push( b.body.position.y );
      packet.push( b.angle );
    }

    function addThrowable(b) {
      packet.push( b.body.position.x );
      packet.push( b.body.position.y );
      packet.push( Math.floor(255*(b.body.angle % (Math.PI*2)) / (Math.PI*2)) );
    }

    // Adds a loot object to the packet
    function gimmeTheLoot(b) {
      packet.push( b.item.id );
      packet.push( b.body.position.x );
      packet.push( b.body.position.y );
      packet.push( b.radius );
      packet.push( Math.floor(255*(b.body.angle % (Math.PI*2)) / (Math.PI*2)) );
    }

    let numPlayers = 0;
    let numBullets = 0;
    let numThrowables = 0;
    let numLoot = 0;

    if(p.isPlaying()) {
      addPlayer(p); // Add yourself to the player packet
      numPlayers++;
    }

    // Add all the other players
    for(var i in players){
      if(
        players[i].inGame() &&
        i !== String(id) &&
        distance(p.body.position, players[i].body.position) < Game.VISIBILITY
      ) {
        addPlayer(players[i]);
        numPlayers++;
      }
    }

    for(var i in bullets){
      if(
        !bullets[i].deleted &&
        distance(p.body.position, bullets[i].body.position) < Game.VISIBILITY
      ) {
        addBullet(bullets[i]); // Add the bullets
        numBullets++; // Count the bullets
      }
    }

    for(var i in throwables){
      if(
        !throwables[i].deleted &&
        distance(p.body.position, throwables[i].body.position) < Game.VISIBILITY
      ) {
        addThrowable(throwables[i]); // Add the throwables
        numThrowables++; // Count the throwables
      }
    }

    for(var i in loot){
      if(
        !loot[i].deleted &&
        distance(p.body.position, loot[i].body.position) < Game.VISIBILITY
      ) {
        gimmeTheLoot(loot[i]); // Gimme the loot!
        numLoot++; // Count the loot
      }
    }

    // Leaderboard
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
    for(var i = Math.min(10, leaderboard.length)-1; i >= 0; i--) {
      packet.push(leaderboard[i].name);
      packet.push(leaderboard[i].score);
    }

    packet[0] = numPlayers;
    packet[1] = numBullets;
    packet[2] = numThrowables;
    packet[3] = numLoot;
    packet[4] = leaderboard.length;

    sendArray(ws, header, packet);
  },

  sendShopMenu: (p, shop) => {
    let packet = [shop.type];
    for(var i in shop.items) {
      packet.push(shop.items[i].id);
      packet.push(shop.items[i].price);
    }

    sendArray(p.ws, Buffer.from(new Uint8Array([3])), packet);
  },

  sendError: (ws, error) => {
    sendArray(ws, Buffer.from(new Uint8Array([4])), [error]);
    ws.player.alive = false;
    ws.close();
  }
}

// Converts an array of ints to bytes and sends it
function sendArray(ws, header, packet) {
  for(var i in packet) {
    switch(typeof packet[i]){
      case "number":
        packet[i] = Buffer.from( intToBytes(packet[i]) );
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
  ws.send(Buffer.concat( [header, packet] ));
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
