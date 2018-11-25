var clients = []; // The socket and some methods for communicating with the client
var players = []; // Holds the player body and a virtual keyboard
var world;

{ // Load Modules
  var express = require('express');
  var http = require('http');
  var path = require('path');
  var WebSocket = require('ws');

  var Matter = require('./server/matter');
  var Client = require('./server/Client');
  var Player = require('./server/Player');
  var physics = require('./server/physics');
  var map = require('./server/map')(Matter);
}

{ // Create express app
  var app = express();
  var server = http.createServer(app);
  var wss = new WebSocket.Server({ "server" : server });
}

{ // Configure matter.js
  // Module Aliases
  var Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

  // Create the world
  var engine = Engine.create();
  world = engine.world;
  World.add(world, []);
  Engine.run(engine);

  for(var i in map) World.addBody(world, map[i]); // Add map bodies to matter js world
}

{ // Allow users to access files in the client folder
  app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
  });
  app.use('/', express.static(__dirname + '/client'));
}

wss.on('connection', function(ws, req){ // User initial connection

  // Create client and player
  var client = new Client(ws, clients.length);
  var player = new Player(Matter, client);
  clients.push(client);
  players.push(player);
  console.log("New client, id: %d", clients.length - 1);

  World.addBody(world, player.body);

  player.body.collisionFilter.group = 1; // Players shouldn't collide with each other

  // Programmed cell suicide
  player.apoptosis = function(){
    player.deleted = true;
    Composite.remove(world, player.body)
  }

  // On user message
  ws.on('message', function(packet){
    var data = new Uint8Array(packet);
    switch(data[0]){
      case 0: // Ping
        client.pong();
        break;
      case 1: // Keyboard Input
        client.setKeyboard(packet.slice(1));
        break;
      case 2: // Request Map Data
        client.mapData();
        break;
    }
  });

  client.mapData(map); // Send map data
});

setInterval(function(){ // Send all players the player data
  for(var i in players){
    var p = players[i];
    if(!p.deleted){
      p.client.playerData(players);
      p.client.mapData(map);
    }
  }
}, 1000 / 60);

setInterval(physics, 1000 / 30, world, map, players) // Update physics

server.listen(process.env.PORT || 9090, function(){ // Listen on the server
  console.log('Listening on %d', server.address().port);
});
