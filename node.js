// Load Modules
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const Matter = require('./server/matter');
const Client = require('./server/Client');
const Player = require('./server/Player');
const Bullet = require('./server/Bullet');
const physics = require('./server/physics');
const map = require('./server/map')(Matter);

var Game = {
  clients: [],
  players: [],
  bullets: [],
  map: map
}

var clients = Game.clients, // The socket and some methods for communicating with the client
    players = Game.players, // Holds the player body and a virtual keyboard
    bullets = Game.bullets; // Holds all of the bullet objects

// Create express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ "server" : server });

// Configure matter js
// Module Aliases
var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events;

// Create the engine and world
var engine = Engine.create();
    world = Game.world = engine.world;
Engine.run(engine);
World.add(world, []);

for(var i in map)
  World.addBody(world, map[i]); // Add map bodies to matter js world

// Allow users to access files in the client folder
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/', express.static(__dirname + '/client'));

// User initial connection
wss.on('connection', (ws, req) => {

  // Create client and player
  const clientId = clients.length;
  let client = new Client(ws, clientId);
  let player = new Player(client);
  clients.push(client);
  players.push(player);
  console.log("New client, id: %d", clientId);

  World.addBody(world, player.body);

  // On user message
  ws.on('message', (packet) => {
    const data = new Uint8Array(packet);
    switch( data[0] ){
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

setInterval(() => { // Send all players the player data
  for(var i in players){
    const p = players[i];
    if(!p.deleted)
      p.client.playerData(Game);
  }
}, 1000 / 60);

Events.on(engine, 'tick', (e) => {
  physics(Game);
});

server.listen(process.env.PORT || 9090, () => { // Listen on the server
  console.log('Listening on %d', server.address().port);
});
