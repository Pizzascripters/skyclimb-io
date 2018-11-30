// Load Modules
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

// Create express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ "server" : server });

// Allow users to access files
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.use('/', express.static(__dirname + '/'));

server.listen(process.env.PORT || 9090, () => { // Listen on the server
  console.log('Listening on %d', server.address().port);
});
