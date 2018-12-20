// Load Modules
const fs = require('fs');
const http = require('http');
const path = require('path');

const express = require('express');
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

wss.on('connection', (ws, req) => {
  ws.on('message', message => {
    const type = message[0];
    if(type === "l") {
      const filename = message.substring(1);
      try {
        const json = fs.readFileSync("./mapmaker/saves/" + filename + ".json").toString();
        ws.send(json);
      } catch {
        console.error(filename + ".json not found");
      }
    } else if (type === "s") {
      let filename = "";
      for(var i = 1; message[i] !== '['; i++)
        filename += message[i];
      const json = message.substring(i);
      fs.writeFile("./mapmaker/saves/" + filename + ".json", json, err => {
        if(err)
          console.error(err);
      });
    }
  });
});

server.listen(process.env.PORT || 9090, () => { // Listen on the server
  console.log('Listening on %d', server.address().port);
});
