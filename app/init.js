// Load Modules
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const Matter = require('./lib/matter');
const Bullet = require('./constructors/Bullet');
const map = require('./map');
const setConstants = require('./constants');
const io = require('./systems/io');
const physics = require('./systems/physics');
const economy = require('./systems/economy');
const cli = require('./systems/cli');

var Game = {
  players: [],    // Player objects
  bullets: [],    // Bullet objects (bullets & pellets)
  throwables: [], // Throwable objects (nades, smokes, nukes?)
  loot: [],       // Dropped items
  map: map
}
cli(Game);
setConstants(Game);

// Create the engine and world
var engine = Matter.Engine.create();
    world = Game.world = engine.world;
Matter.Engine.run(engine);
Matter.World.add(world, []);
for(var i in map.bodies)
  Matter.World.addBody(world, map.bodies[i]); // Add map bodies to matter js world

// Create express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ "server" : server });

// Handle http requests
app.use('/', (req, res) => {
  io.httpHandle(req, res, __dirname);
});

// User initial connection
wss.on('connection', (ws, req) => {
  io.wsConnection(ws, Game);
});

var prevTime = 0;
setInterval(io.update, 1000 / Game.packetsPerSecond, Game);
setInterval(economy.update, 10, Game.players, Game.map, 10, Game.MAX_HEIGHT, Game.MIN_HEIGHT, Game.GOLD_CAP);
Matter.Events.on(engine, 'afterUpdate', (e) => {
  var delta = e.timestamp - prevTime;
  prevTime = e.timestamp;
  physics(Game, delta);
});

server.listen(process.env.PORT || 9090, () => {
  console.log('Listening on %d', server.address().port);
});
