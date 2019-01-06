var cvs, ctx;         // Canvas and context
var menuElement;      // The header that displays the text
var ws;               // Websocket
var images = {};
var mouse = {
  x: 0,
  y: 0
}
var keyboard = {
  ctrl: false,
  shift: false,
  up: false,
  left: false,
  down: false,
  right: false
};
var vertices = [];
var edges = [];
var objects = [];
var objectTypes = [];
var shops = [];
var objectSelected = [{id: null}];
var vertexSelected = [{id: null}];
var shop = null;
var correctAngle = null;

var cam = {x: 0, y: 0, zoom: 1};
var menu = "main";
var objectType = "solid";
const PAN_SPEED = 10;

window.addEventListener("load", init);
window.addEventListener("resize", fullscreen);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.addEventListener("mousedown", mousedown);
window.addEventListener("mousemove", mousemove);
window.addEventListener("contextmenu", e => {e.preventDefault()});
window.addEventListener("wheel", zoom);
window.onbeforeunload = ()=>{return""};

function init(e){
  cvs = document.getElementById("cvs");
  ctx = cvs.getContext("2d");
  menuElement = document.getElementById("menu");
  mainMenu();

  // Connect to websocket server
  if( window.location.href.startsWith("https") ) {
    ws = new WebSocket("wss://" + window.location.href.substring(6));
  } else {
    ws = new WebSocket("ws://" + window.location.href.substring(5));
  }
  ws.onmessage = packet => {
    loadJSON(JSON.parse(packet.data));
  }
  ws.onclose = () => {
    console.error("Socket closed");
  };

  fullscreen();
  loadImages(draw);
}

function draw() {
  if(keyboard.up)
    cam.y -= PAN_SPEED / cam.zoom;
  if(keyboard.left)
    cam.x -= PAN_SPEED / cam.zoom;
  if(keyboard.down)
    cam.y += PAN_SPEED / cam.zoom;
  if(keyboard.right)
    cam.x += PAN_SPEED / cam.zoom;

  ctx.clearRect(0, 0, cvs.width, cvs.height);

  if(shop)
    ctx.drawImage(images.shops[shop], mouse.x, mouse.y, images.shops[shop].width * cam.zoom, images.shops[shop].height * cam.zoom);

  ctx.save();
  ctx.translate(cvs.width / 2, cvs.height / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y)

  // Draw object
  for(var i1 in objects) {
    const obj = objects[i1];
    ctx.beginPath();
    for(var i2 in obj) {
      if(i2 === 0)
        ctx.moveTo(obj[i2].x, obj[i2].y);
      else
        ctx.lineTo(obj[i2].x, obj[i2].y);
    }
    if(objectTypes[i1] === "solid") {
      ctx.fillStyle = "#aaa";
    } else if(objectTypes[i1] === "safezone") {
      ctx.fillStyle = "#0bf";
    }
    ctx.fill();
    ctx.stroke();
  }

  // Draw shops
  for(var i in shops)
    ctx.drawImage(images.shops[shops[i].type], shops[i].x, shops[i].y);

  // Draw vertices
  ctx.fillStyle = "#000";
  for(var i in vertices) {
    const v = vertices[i];
    ctx.beginPath();
    ctx.arc(v.x, v.y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw green line
  if(vertexSelected && correctAngle !== null) {
    ctx.strokeStyle = "#0f0";
    ctx.beginPath();
    ctx.moveTo(vertexSelected.x - 1000 * Math.cos(correctAngle), vertexSelected.y - 1000 * Math.sin(correctAngle));
    ctx.lineTo(vertexSelected.x + 1000 * Math.cos(correctAngle), vertexSelected.y + 1000 * Math.sin(correctAngle));
    ctx.arc(vertexSelected.x, vertexSelected.y, 1000, correctAngle, 2 * Math.PI + correctAngle);
    ctx.stroke();
    ctx.strokeStyle = "#000";
  }

  if(vertexSelected.id !== null){
    ctx.beginPath();
    ctx.moveTo(vertexSelected.x, vertexSelected.y);
  }

  ctx.restore();

  const side = 100 * cam.zoom;
  ctx.drawImage(images.player, cvs.width / 2 - side / 2, cvs.height / 2 - side / 2, side, side);

  if(vertexSelected.id !== null){
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

function mainMenu() {
  menu = "main";
  menuElement.innerHTML = "1 - Load <br /> 2 - Save <br /> 3 - Shops <br /> 4 - Object Type"
}

function loadMenu() {
  menu = "load";
  menuElement.innerHTML = "0 - Back <br /> 1 - Load JSON <br /> <input type='text' id='load' />"
}

function saveMenu() {
  menu = "save";
  menuElement.innerHTML = "0 - Back <br /> 1 - Save JSON <br /> <input type='text' id='save' />"
}

function shopMenu() {
  menu = "shop";
  menuElement.innerHTML = "0 - Back <br /> 1 - Generic Shop";
}

function objectTypeMenu() {
  menu = "objectType";
  menuElement.innerHTML = "0 - Back <br /> 1 - Solid <br /> 2 - Safe Zone";
}

function requestJSON() {
  const filename = document.getElementById("load").value;
  ws.send("l" + filename);
}

function saveJSON() {
  const filename = document.getElementById("save").value;
  ws.send("s" + filename + getJSON());
}

function keydown(e) {
  if(document.activeElement.nodeName !== "BODY")
    return;

  switch(e.keyCode) {
    case 16:
      keyboard.shift = true;
      if(keyboard.ctrl) {
        correctAngle = -Math.PI / 4;
      } else {
        correctAngle = Math.PI / 2;
      }
      break;
    case 17:
      keyboard.ctrl = true;
      if(keyboard.shift) {
        correctAngle = Math.PI / 4;
      } else {
        correctAngle = 0;
      }
      break;
    case 27: // Esc
    case 48:
    case 96: // 0
      if(menu !== "main") {
        mainMenu();
      }
      break;
    case 49:
    case 97: // 1
      if(menu === "main") {
        loadMenu();
      } else if (menu === "load") {
        requestJSON();
      } else if (menu === "save") {
        saveJSON();
      } else if (menu === "shop") {
        shop = "generic";
      } else if (menu === "objectType") {
        objectType = "solid";
      }
      break;
    case 50:
    case 98: // 2
      if(menu === "main") {
        saveMenu();
      } else if (menu === "objectType") {
        objectType = "safezone";
      }
      break;
    case 51:
    case 99: // 3
      if(menu === "main") {
        shopMenu();
      }
      break;
    case 52:
    case 100: // 4
      if(menu === "main") {
        objectTypeMenu();
      }
      break;
    case 87: // W
      keyboard.up = true;
      break;
    case 65: // A
      keyboard.left = true;
      break;
    case 83: // S
      keyboard.down = true;
      break;
    case 68: // D
      keyboard.right = true;
      break;
  }
}

function keyup(e) {
  switch(e.keyCode) {
    case 16:
      keyboard.shift = false;
      if(keyboard.ctrl) {
        correctAngle = 0;
      } else {
        correctAngle = null;
      }
      break;
    case 17:
      keyboard.ctrl = false;
      if(keyboard.shift) {
        correctAngle = Math.PI / 2;
      } else {
        correctAngle = null;
      }
      break;
    case 87: // W
      keyboard.up = false;
      break;
    case 65: // A
      keyboard.left = false;
      break;
    case 83: // S
      keyboard.down = false;
      break;
    case 68: // D
      keyboard.right = false;
      break;
  }
}

function mousedown(e) {
  const x = e.clientX;
  const y = e.clientY;

  var v = {
    id: uniqueId(),
    x: (x - cvs.width / 2) / cam.zoom + cam.x,
    y: (y - cvs.height / 2) / cam.zoom + cam.y,
    object: [{id: null}]
  }

  // Search for nearby vertices and shops
  let nearby = false;
  let nearbytype = null;
  for(var i in vertices){
    if(distance(vertices[i], v) < 20) {
      nearby = i;
      nearbytype = "vertex";
    }
  }
  for(var i in shops){
    if(distance(shops[i], v) < 20) {
      nearby = i;
      nearbytype = "shop";
    }
  }

  if(shop) {
      if(e.button === 0) {
        shops.push({
          type: shop,
          x: v.x,
          y: v.y
        });
      } else if(e.button === 2) {
        shop = null;
      }
  } else {
    if(e.button === 0){
      if(nearbytype === "vertex"){
        let obj = vertices[nearby].object;

        let index = 0;
        for(var i in obj)
          if(obj[i].id === vertices[nearby].id) index = i;

        obj.splice(index, 1);
        vertices.splice(nearby, 1);

        for(var i in objects)
          if(objects[i].length === 0) objects.splice(i, 1);
      } else if (nearbytype === "shop") {
        let s = shops[nearby];
        shops.splice(nearby, 1);
      } else {
        if(correctAngle !== null) {
          adjustToLine(v);
        }
        vertices.push(v);
      }
    } else if(e.button === 2 && nearbytype === "vertex") {
      let v = vertices[nearby];

      if(objectSelected[0].id === v.object[0].id && objectSelected[0].id !== null) { // Object forms a loop
        objectSelected = [{id: null}];
        vertexSelected = [{id: null}];
      } else if(objectSelected[0].id !== v.object[0].id && objectSelected[0].id !== null && v.object[0].id !== null) { // User tries to give a vertex a second object
        objectSelected = [{id: null}];
        vertexSelected = [{id: null}];
      } else if (objectSelected[0].id === null && v.object[0].id !== null) { // Recontinue an object
        objectSelected = v.object;
        vertexSelected = v;
      } else if (objectSelected[0].id === null){ // Begin an object
        v.object = [v];
        objectSelected = v.object;
        vertexSelected = v;
        objects.push(v.object);
        objectTypes.push(objectType);
      } else { // Add a vertex to an object
        let index = objectSelected.length;
        for(var i in objectSelected)
          if(objectSelected[i].id === vertexSelected.id) index = i;

        v.object = objectSelected;
        v.object.splice(index, 0, v);
        vertexSelected = v;
      }
    } else if(e.button === 2 && !nearby) {
      objectSelected = [{id: null}];
      vertexSelected = [{id: null}];
    }
  }
}

function mousemove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function zoom(e) {
  if(e.deltaY < 0)
    cam.zoom *= 1.1;
  else
    cam.zoom /= 1.1;
  if(cam.zoom > 1)
    cam.zoom = 1;
}

function loadImages(callback) {
  var count = 0;
  var onload = () => {
    count++;
    if(count === Object.keys(images).length) callback();
  }

  images.player = loadImage("player.png", onload);
  images.shops = {};
  images.shops.generic = loadImage("shops/generic.png", onload);
}

function loadImage(src, callback) {
  var img = new Image();
  img.src = "/" + src;
  img.onload = callback;
  return img;
}

function fullscreen(e){
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

function getJSON(){
  let json = {};

  json.objects = [];
  for(var i1 in objects) {
    let obj = [];
    for(var i2 in objects[i1]) {
      const v = objects[i1][i2];
      obj.push({
        x:Math.floor(v.x),
        y:Math.floor(v.y)
      });
    }
    json.objects.push(obj);
  }

  json.shops = [];
  for(var i in shops) {
    json.shops.push({
      type: shops[i].type,
      x: Math.floor(shops[i].x),
      y: Math.floor(shops[i].y)
    });
  }

  json.objectTypes = [];
  for(var i in objectTypes) {
    json.objectTypes.push(objectTypes[i]);
  }

  return JSON.stringify(json);
}

function loadJSON(json) {
  for(var i1 in json.objects) {
    let obj = [];
    for(var i2 in json.objects[i1]) {
      let v = json.objects[i1][i2];

      v.id = uniqueId();
      v.object = obj;

      vertices.push(v);
      obj.push(v);
    }
    objects.push(obj);
  }

  for(var i in json.shops) {
    shops.push(json.shops[i])
  }

  for(var i in json.objectTypes) {
    objectTypes.push(json.objectTypes[i])
  }
}

function adjustToLine(v) {
  var a = Math.tan(correctAngle);
  var b = -1;
  var c = vertexSelected.y - vertexSelected.x * Math.tan(correctAngle);
  var d = Math.abs(a*v.x + b*v.y + c) / Math.sqrt(a*a + b*b); // Distance from point to line
  if(0 > a*v.x + b*v.y + c) {
    var perpAngle = correctAngle - Math.PI / 2;
  } else {
    var perpAngle = correctAngle + Math.PI / 2;
  }
  v.x = v.x + d * Math.cos(perpAngle)
  v.y = v.y + d * Math.sin(perpAngle)
}

function uniqueId() {
  let id = 0;
  while( true ) {
    let found = false;
    for(var i in vertices) {
      const v = vertices[i];
      if(v.id === id) {
        found = true;
        break;
      }
    }
    if(!found) return id;
    id++;
  }
}

function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}
