// Load Modules
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const Matter = require('./lib/matter');
const map = require('./map');
const Player = require('./constructors/Player');
const Bullet = require('./constructors/Bullet');
const io = require('./systems/io');
const physics = require('./systems/physics');
const economy = require('./systems/economy');

var Game = {
  players: [],
  bullets: [],
  throwables: [],
  map: map
}

var players = Game.players, // Holds the player body and a virtual keyboard
    bullets = Game.bullets, // Holds all of the bullet objects
    throwables = Game.throwables; // Holds all of the throwable objects (nades, smokes, nukes?)

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

  // Create the player
  const playerId = players.length;
  let player = new Player(ws, playerId);
  players.push(player);
  console.log("New client, id: %d", playerId);

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
    if(!p.disconnected && !p.deleted)
      io.playerData(p, Game, p.id);
  }
}, 1000 / 60);

setInterval(economy.update, 1000, Game.players);

Events.on(engine, 'beforeUpdate', (e) => {
  physics(Game);
});

server.listen(process.env.PORT || 9090, () => {
  console.log('Listening on %d', server.address().port);
});
