const distance = require('../util/distance');
const insideRect = require('../util/insideRect');

const VISIBILITY = 1100; // Any objectect at a greater distance will not be sent to client
const WATER_HEIGHT = 6000;

const io = module.exports = {
  handle: (ws, p, Game, packet) => {
    if(p.state === p.SPECTATING) return 1;
    const data = new Uint8Array(packet);
    switch( data[0] ){
      case 0: // Ping
        io.pong(ws);
        break;
      case 1: // Keyboard Input
        io.setKeyboard(ws, packet.slice(1), p);
        break;
      case 2: // Request Map Data
        io.mapData(ws, Game.map);
        break;
      case 3: // Buy Item
        io.buyItem(ws, p, Game.map.shops, packet[1], packet[2]);
        break;
      case 4:
        switch(io.setName(ws, packet.slice(1), Game.players, p)) {
          case 0:
            p.state = p.PLAYING;
            break;
          case 1:
            io.sendError(ws, "Name already taken");
            p.state = p.DELETED;
            ws.close();
            break;
          case 2:
            io.sendError(ws, "Invalid Name");
            p.state = p.DELETED;
            ws.close();
            break;
        }
        break;
    }
  },

  /*  Following are a series of functions that send a packet to the client
      Each has a 1 byte header to identify its purpose */

  pong: ws => { // 0 - Return ping
    if(ws.readyState === ws.CLOSED)
      return 1;

    const header = Buffer.from( new Uint8Array([0]) );
    ws.send(header);

    return 0;
  },

  setKeyboard: (ws, packet, player) => { // 1 - Update keyboard object
    // Sticky buttons only reset on update, not in io
    let stickyButtons = ["throw", "consume", "select", "drop", "loot"]
    for(var i in player.keyboard) {
      if(stickyButtons.indexOf(i) === -1) {
        player.keyboard[i] = false;
      }
    }

    let ref = {i:0}; // We want to pass i by reference to readInt can increment it

    player.hand = readInt(packet, ref);
    if(readInt(packet, ref)) player.keyboard.left = true;
    if(readInt(packet, ref)) player.keyboard.right = true;
    if(readInt(packet, ref)) player.keyboard.jump = true;
    if(readInt(packet, ref)) player.keyboard.shoot = true;
    if(readInt(packet, ref)) player.keyboard.select = true;
    if(readInt(packet, ref)) player.keyboard.drop = true;
    if(readInt(packet, ref)) player.keyboard.loot = true;
    player.inventory.select = readInt(packet, ref);
  },

  mapData: (ws, map, WATER_HEIGHT) => { // Send map data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING)
      return 1;

    // 1 byte header
    const header = Buffer.from( new Uint8Array([1]) );
    let packet = [];

    packet.push( WATER_HEIGHT );

    // Add the body to the packet
    function addObject(obj) {
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

    // Sends the outline of the map
    packet.push(map.objects.length);
    for(var i in map.objects)
      addObject(map.objects[i]);

    // Sends the physical map (for debugging only)
    /*for(var i1 in map.bodies) {
      packet.push(map.bodies[i1].vertices.length);
      for(var i2 in map.bodies[i1].vertices) {
        packet.push(map.bodies[i1].vertices[i2].x);
        packet.push(map.bodies[i1].vertices[i2].y);
      }
    }*/

    // Sends all the shops
    packet.push(map.shops.length);
    for(var i in map.shops)
      addShop(map.shops[i]);

    // Turn all the numbers into bytes
    for(var i in packet)
      packet[i] = Buffer.from( intToBytes(packet[i]) );

    packet = Buffer.concat( packet );
    ws.send( Buffer.concat([header, packet]) );

    return 0;
  },

  buyItem: (ws, p, shops, slot, amount) => {
    for(var i in shops) {
      const rect = {
        x: shops[i].x - p.radius,
        y: shops[i].y - p.radius,
        width: shops[i].width + p.radius * 2,
        height: shops[i].height + p.radius * 2
      }
      if(insideRect(p.body.position, rect)) {
        const shop = shops[i];
        if(shop.items[slot])
          shop.items[slot].buy(p, amount);
      }
    }
  },

  setName: (ws, packet, players, p) => {
    var ref = {i:0};
    const name = readString(packet, ref);
    // Check if anyone else has this name
    for(var i in players) {
      if(players[i].name.toLowerCase() === name.toLowerCase()) return 1;
    }
    if(name.startsWith("guest")) return 2;
    p.name = name;
    return 0;
  },

  playerData: (p, Game) => { // Send player and bullet data
    const id = p.id,
          ws = p.ws;

    var players = Game.players,
        bullets = Game.bullets,
        throwables = Game.throwables,
        loot = Game.loot,
        world = Game.world;

    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
        if(p.state === p.PLAYING) {
          p.state = p.DISCONNECTED;
        } else {
          p.state = p.DELETED;
        }
        return 1;
    }

    // 1 byte header
    const header = Buffer.from( new Uint8Array([2]) );
    let packet = [];

    packet.push(0, 0, 0, 0); // For counting players, bullets, throwables, and loot
    packet.push(p.state === p.SPECTATING ? 1 : 0);

    if(p.state === p.SPECTATING) {
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
      }
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

    if(players[id].state === players[id].PLAYING) {
      addPlayer(players[id]); // Add yourself to the player packet
      numPlayers++;
    }

    for(var i in players){
      if(
        players[i].state !== players[id].SPECTATING &&
        i !== String(id) &&
        distance(p.body.position, players[i].body.position) < VISIBILITY
      ) {
        addPlayer(players[i]); // Add all the other players
        numPlayers++;
      }
    }

    for(var i in bullets){
      if(
        !bullets[i].deleted &&
        distance(p.body.position, bullets[i].body.position) < VISIBILITY
      ) {
        addBullet(bullets[i]); // Add the bullets
        numBullets++; // Count the bullets
      }
    }

    for(var i in throwables){
      if(
        !throwables[i].deleted &&
        distance(p.body.position, throwables[i].body.position) < VISIBILITY
      ) {
        addThrowable(throwables[i]); // Add the throwables
        numThrowables++; // Count the throwables
      }
    }

    for(var i in loot){
      if(
        !loot[i].deleted &&
        distance(p.body.position, loot[i].body.position) < VISIBILITY
      ) {
        gimmeTheLoot(loot[i]); // Gimme the loot!
        numLoot++; // Count the loot
      }
    }

    packet[0] = numPlayers;
    packet[1] = numBullets;
    packet[2] = numThrowables;
    packet[3] = numLoot;

    sendArray(ws, header, packet);
  },

  shopData: (p, shop) => {
    let packet = [shop.type];
    for(var i in shop.items) {
      packet.push(shop.items[i].id);
      packet.push(shop.items[i].price);
    }

    sendArray(p.ws, Buffer.from(new Uint8Array([3])), packet);
  },

  sendError: (ws, error) => {
    sendArray(ws, Buffer.from(new Uint8Array([4])), [error]);
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
    }
  }

  packet = Buffer.concat( packet );
  ws.send(Buffer.concat( [header, packet] ));
}

// Reads a one byte integer from an index in a byte array
function readInt(a, ref) {
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
