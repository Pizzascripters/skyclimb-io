// Load Modules
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const Matter = require('./lib/matter');
const Client = require('./constructors/Client');
const Player = require('./constructors/Player');
const Bullet = require('./constructors/Bullet');
const io = require('./systems/io');
const physics = require('./systems/physics');
const map = require('./map');

var Game = {
  clients: [],
  players: [],
  bullets: [],
  map: map
}

var clients = Game.clients, // The socket and some methods for communicating with the client
    players = Game.players, // Holds the player body and a virtual keyboard
    bullets = Game.bullets; // Holds all of the bullet objects

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

for(var i in map.bodies)
  World.addBody(world, map.bodies[i]); // Add map bodies to matter js world

// Create express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ "server" : server });

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
        io.pong(ws);
        break;
      case 1: // Keyboard Input
        io.setKeyboard(ws, packet.slice(1), player);
        break;
      case 2: // Request Map Data
        io.mapData(ws, map);
        break;
    }
  });

  io.mapData(ws, map); // Send map data
});

setInterval(() => { // Send all players the player data
  for(var i in players){
    const p = players[i];
    if(!p.deleted)
      io.playerData(p.client.socket, Game, p.id);
  }
}, 1000 / 60);

Events.on(engine, 'afterUpdate', (e) => {
  physics(Game);
});

server.listen(process.env.PORT || 9090, () => { // Listen on the server
  console.log('Listening on %d', server.address().port);
});
