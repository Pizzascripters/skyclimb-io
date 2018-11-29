const intToBytes = require('./intToBytes');

module.exports = function(ws, id){
  this.id = id;
  this.socket = ws;
  this.player = {};

  /*  Following are a series of functions that send a packet to the client
      Each has a 1 byte header to identify its purpose */

  this.pong = () => { // 0 - Return ping
    if(ws.readyState === ws.CLOSED)
      return 1;

    let header = Buffer.from( new Uint8Array([0]) );
    ws.send(header);

    return 0;
  }

  this.setKeyboard = (packet) => { // 1 - Update keyboard object
    this.player.keyboard.left = false;
    this.player.keyboard.right = false;
    this.player.keyboard.jump = false;
    this.player.keyboard.shoot = false;

    let body = this.player.body;

    this.player.hand = packet[0];

    if(packet[1]) this.player.keyboard.left = true;
    if(packet[2]) this.player.keyboard.right = true;
    if(packet[3]) this.player.keyboard.jump = true;
    if(packet[4]) this.player.keyboard.shoot = true;
  }

  this.mapData = (map) => { // Send map data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING)
      return 1;

    // 1 byte header
    var header = Buffer.from( new Uint8Array([1]) );
    var packet = [];

    // Add the body to the packet
    function addBody(body) {
      packet.push( body.vertices.length );
      for(var i in body.vertices){
        packet.push( body.vertices[i].x );
        packet.push( body.vertices[i].y );
      }
    }

    // Add them to the packet
    for(var i in map)
      addBody(map[i]);

    // Turn all the numbers into bytes
    for(var i in packet)
      packet[i] = Buffer.from( intToBytes(packet[i]) );

    packet = Buffer.concat( packet );
    ws.send( Buffer.concat([header, packet]) );

    return 0;
  }

  this.playerData = (Game) => { // Send player data
    var players = Game.players,
        bullets = Game.bullets,
        world = Game.world;

    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
        players[id].apoptosis(world);
        return 1;
    }

    // 1 byte header
    var header = Buffer.from( new Uint8Array([2]) );
    var packet = [];

    packet[0] = 0; // For counting players

    // Adds a player to the packet
    function addPlayer(p) {
      for(var i in p.body.vertices){
        packet.push( p.body.vertices[i].x );
        packet.push( p.body.vertices[i].y );
      }
      packet.push( p.hand );
    }

    function addBullet(b) {
      for(var i in b.body.vertices){
        packet.push( b.body.vertices[i].x );
        packet.push( b.body.vertices[i].y );
      }
    }

    addPlayer(players[id]); // Add yourself to the player packet
    let num_players = 1;    // For counting the number of players

    for(var i in players){
      if(players[i].deleted || i === String(id))
        continue;
      addPlayer(players[i]); // Add all the other players
      num_players++;
    }

    for(var i in bullets){
      if(bullets[i].deleted)
        continue;
      addBullet(bullets[i]); // Add the bullets
    }

    // Turn all the numbers into bytes
    for(var i in packet)
      packet[i] = Buffer.from( intToBytes(packet[i]) );

    packet[0] = Buffer.from( [num_players] ); // Indicate the number of players

    packet = Buffer.concat( packet );
    ws.send(Buffer.concat( [header, packet] ));

    return 0;
  }
}
