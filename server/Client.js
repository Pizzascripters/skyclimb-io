const intToBytes = require('./intToBytes');

module.exports = function(ws, id){
  this.id = id;
  this.socket = ws;

  /*  Following are a series of functions that send a packet to the client
      Each has a 1 byte header to identify its purpose */

  this.pong = function(){ // 0 - Return ping
    if(ws.readyState === ws.CLOSED) return 1;

    var header = Buffer.from( new Uint8Array([0]) );
    ws.send(header);

    return 0;
  }

  this.setKeyboard = function(packet){ // 1 - Update keyboard object
    this.player.keyboard.left = false;
    this.player.keyboard.right = false;
    this.player.keyboard.jump = false;

    var body = this.player.body;

    if(packet[0]) this.player.keyboard.left = true;
    if(packet[1]) this.player.keyboard.right = true;
    if(packet[2]) this.player.keyboard.jump = true;

    this.player.hand = packet[3];
  }

  this.mapData = function(map){ // Send map data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) return 1;

    // 1 byte header
    var header = Buffer.from( new Uint8Array([1]) );
    var packet = [];

    // Add the body to the packet
    function addBody(body) {
      packet.push( Buffer.from( intToBytes(body.vertices.length) ) );
      for(var i in body.vertices){
        packet.push( Buffer.from( intToBytes(body.vertices[i].x) ) );
        packet.push( Buffer.from( intToBytes(body.vertices[i].y) ) );
      }
    }

    // Add them to the packet
    for(var i in map) addBody(map[i]);

    packet = Buffer.concat( packet );
    ws.send(Buffer.concat( [header, packet] ));

    return 0;
  }

  this.playerData = function(players){ // Send player data
    if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
        players[id].apoptosis();
        return 1;
    }

    // 1 byte header
    var header = Buffer.from( new Uint8Array([2]));
    var packet = [];

    // Adds a player to the packet
    function addPlayer(p) {
      for(var i in p.body.vertices){
        packet.push( Buffer.from( intToBytes(p.body.vertices[i].x) ) );
        packet.push( Buffer.from( intToBytes(p.body.vertices[i].y) ) );
      }
      packet.push( Buffer.from( intToBytes(p.hand) ) );
    }

    addPlayer(players[id]); // Add yourself to the player packet
    for(var i in players){
      if(players[i].deleted || i === String(id)) continue;
      addPlayer(players[i]); // Add all the other players
    }

    packet = Buffer.concat( packet );
    ws.send(Buffer.concat( [header, packet] ));

    return 0;
  }
}
