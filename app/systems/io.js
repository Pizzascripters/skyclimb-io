const distance = require('../lib/distance');

const VISIBILITY = 1100; // Any objectect at a greater distance will not be sent to client

module.exports = {
  /*  Following are a series of functions that send a packet to the client
      Each has a 1 byte header to identify its purpose */

  pong: (ws) => { // 0 - Return ping
    if(ws.readyState === ws.CLOSED)
      return 1;

    const header = Buffer.from( new Uint8Array([0]) );
    ws.send(header);

    return 0;
  },

  setKeyboard: (ws, packet, player) => { // 1 - Update keyboard object
    player.keyboard.left = false;
    player.keyboard.right = false;
    player.keyboard.jump = false;
    player.keyboard.shoot = false;
    player.keyboard.throw = false;

    player.hand = packet[0];

    if(packet[1]) player.keyboard.left = true;
    if(packet[2]) player.keyboard.right = true;
    if(packet[3]) player.keyboard.jump = true;
    if(packet[4]) player.keyboard.shoot = true;
    if(packet[5]) player.keyboard.throw = true;

    player.inventory.select = packet[6];
  },

  mapData: (ws, map) => { // Send map data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING)
      return 1;

    // 1 byte header
    const header = Buffer.from( new Uint8Array([1]) );
    let packet = [];

    // Add the body to the packet
    function addObject(obj) {
      packet.push( obj.length );
      for(var i in obj){
        packet.push( obj[i].x );
        packet.push( obj[i].y );
      }
    }

    // Sends the outline of the map
    /*for(var i in map.objects)
      addObject(map.objects[i]);*/

    // Sends the physical map (for debugging only)
    for(var i1 in map.bodies) {
      packet.push(map.bodies[i1].vertices.length);
      for(var i2 in map.bodies[i1].vertices) {
        packet.push(map.bodies[i1].vertices[i2].x);
        packet.push(map.bodies[i1].vertices[i2].y);
      }
    }

    // Turn all the numbers into bytes
    for(var i in packet)
      packet[i] = Buffer.from( intToBytes(packet[i]) );

    packet = Buffer.concat( packet );
    ws.send( Buffer.concat([header, packet]) );

    return 0;
  },

  playerData: (p, Game) => { // Send player and bullet data
    const id = p.id,
          ws = p.ws;

    var players = Game.players,
        bullets = Game.bullets,
        throwables = Game.throwables,
        world = Game.world;

    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
        players[id].disconnected = true;
        return 1;
    }

    // 1 byte header
    const header = Buffer.from( new Uint8Array([2]) );
    let packet = [];

    packet[0] = 0; // For counting players
    packet[1] = 0; // For counting bullets
    packet[2] = 0; // For counting throwables

    // Adds a player to the packet
    function addPlayer(p) {
      const radius = distance(p.body.position, p.body.vertices[0]);
      packet.push( p.body.position.x );
      packet.push( p.body.position.y );
      packet.push( radius );
      packet.push( p.hand );
      packet.push( Math.floor(p.health * 255) );
      packet.push( Math.floor(p.energy * 255) );
      packet.push( p.getItem().id ); // The weapon player is holding

      if(p.id === id) {
        // Inventory
        for(var i = 0; i < p.inventory.items.length; i++)
          packet.push( p.inventory.items[i].id );

        packet.push( p.kills );
        packet.push( p.gold );
        packet.push( p.score );
      }
    }

    function addBullet(b) {
      for(var i in b.body.vertices){
        packet.push( b.body.vertices[i].x );
        packet.push( b.body.vertices[i].y );
      }
      packet.push( b.angle );
    }

    function addThrowable(b) {
      packet.push( b.body.position.x );
      packet.push( b.body.position.y );
      packet.push( Math.floor(255*(b.body.angle % (Math.PI*2)) / (Math.PI*2)) );
    }

    let numPlayers = 1;
    let numBullets = 0;
    let numThrowables = 0;

    addPlayer(players[id]); // Add yourself to the player packet

    for(var i in players){
      if(
        !players[i].deleted &&
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

    packet[0] = numPlayers;
    packet[1] = numBullets;
    packet[2] = numThrowables;

    // Turn all the numbers into bytes
    for(var i in packet)
      packet[i] = Buffer.from( intToBytes(packet[i]) );

    packet = Buffer.concat( packet );
    ws.send(Buffer.concat( [header, packet] ));

    return 0;
  }
}

// Converts a unit8array to a string
function bytesToStr(bytes){
  let str = "";
  for(var i = 0; i < bytes.length; i++){
    if(bytes[i] !== 0)
      str += String.fromCharCode(bytes[i]);
  }
  return str;
}

function strToBytes(str){
  let bytes = [];
  for(var i = 0; i < str.length; i++){
    const code = str.charCodeAt(i);
    bytes = bytes.concat([code]);
  }
  return bytes;
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
