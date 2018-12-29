// Load Modules
const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const Matter = require('./lib/matter');
const Player = require('./constructors/Player');
const Bullet = require('./constructors/Bullet');
const map = require('./map');
const io = require('./systems/io');
const physics = require('./systems/physics');
const economy = require('./systems/economy');
const cli = require('./systems/cli');

var Game = {
  players: [],
  bullets: [],
  throwables: [],
  loot: [],
  map: map
}
cli(Game);

Game.WATER_HEIGHT = 6000;

var players = Game.players, // Holds the player body and a virtual keyboard
    bullets = Game.bullets, // Holds all of the bullet objects
    throwables = Game.throwables, // Holds all of the throwable objects (nades, smokes, nukes?)
    loot = Game.loot;

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
app.use('/img', (req, res, next) => {
  fs.access(__dirname + '/client/img' + req.url, err => {
    if(err) {
      res.sendFile(__dirname + '/client/img/notexture.png'); // 404 -> No texture image
    } else {
      res.sendFile(__dirname + '/client/img' + req.url);
    }
  });
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
  ws.on('message', packet => {
    io.handle(ws, player, Game, packet);
  });

  io.mapData(ws, map, Game.WATER_HEIGHT); // Send map data
});

setInterval(() => {
  // Remove deleted objects
  for(var i in players)
    if(players[i].deleted)
      delete players[i];
  for(var i in bullets)
    if(bullets[i].deleted)
      delete bullets[i];
  for(var i in throwables)
    if(throwables[i].deleted)
      delete throwables[i];
  for(var i in loot)
    if(loot[i].deleted)
      delete loot[i];

  // Send all players the player data
  for(var i in players){
    const p = players[i];
    if(!p.disconnected)
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
