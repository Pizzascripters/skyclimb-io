var cvs, ctx;         // Canvas and context
var ws;               // Websocket
var images = {};
var mouse = {
  x: 0,
  y: 0
}
var keyboard = {
  up: false,
  left: false,
  down: false,
  right: false
};
var vertices = [];
var edges = [];
var objects = [];
var objectSelected = [{id: null}];;
var vertexSelected = [{id: null}];;

var cam = {x: 0, y: 0, zoom: 1};
const PAN_SPEED = 10;

window.addEventListener("load", init);
window.addEventListener("resize", fullscreen);
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);
window.addEventListener("mousedown", mousedown);
window.addEventListener("mousemove", mousemove);
window.addEventListener("contextmenu", (e) => {e.preventDefault()});
window.addEventListener("wheel", zoom);

function init(e){
  cvs = document.getElementById("cvs");
  ctx = cvs.getContext("2d");

  // Connect to websocket server
  if( window.location.href.startsWith("https") ) {
      ws = new WebSocket("wss://" + window.location.href.substring(6));
  } else {
    ws = new WebSocket("ws://" + window.location.href.substring(5));
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

  const side = 100 * cam.zoom;
  ctx.drawImage(images.player, cvs.width / 2 - side / 2, cvs.height / 2 - side / 2, side, side);

  ctx.save();
  ctx.translate(cvs.width / 2, cvs.height / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y)

  // Draw vertices
  ctx.fillStyle = "#000";
  for(var i in vertices) {
    const v = vertices[i];
    ctx.beginPath();
    ctx.arc(v.x, v.y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

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
    ctx.stroke();
  }

  if(vertexSelected.id !== null){
    ctx.beginPath();
    ctx.moveTo(vertexSelected.x, vertexSelected.y);
  }

  ctx.restore();

  if(vertexSelected.id !== null){
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

function keydown(e) {
  switch(e.keyCode) {
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

  const v = {
    id: uniqueId(),
    x: (x - cvs.width / 2) / cam.zoom + cam.x,
    y: (y - cvs.height / 2) / cam.zoom + cam.y,
    object: [{id: null}]
  }

  // Search for nearby vertex
  let nearby = false;
  for(var i in vertices){
    if(distance(vertices[i], v) < 20)
      nearby = i;
  }

  if(e.button === 0){
    if(nearby){
      let obj = vertices[nearby].object;

      let index = 0;
      for(var i in obj)
        if(obj[i].id === vertices[nearby].id) index = i;

      obj.splice(index, 1);
      vertices.splice(nearby, 1);

      for(var i in objects)
        if(objects[i].length === 0) objects.splice(i, 1);
    } else
      vertices.push(v);
  } else if(e.button === 2 && nearby) {
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
  let json = [];

  for(var i1 in objects) {
    let obj = [];
    for(var i2 in objects[i1]) {
      const v = objects[i1][i2];
      obj.push({
        x:Math.floor(v.x),
        y:Math.floor(v.y)
      });
    }
    json.push(obj);
  }

  return JSON.stringify(json);
}

function loadJSON(json) {
  for(var i1 in json) {
    let obj = [];
    for(var i2 in json[i1]) {
      let v = json[i1][i2];

      v.id = uniqueId();
      v.object = obj;

      vertices.push(v);
      obj.push(v);
    }
    objects.push(obj);
  }
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
