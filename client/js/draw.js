function draw(delta){
  ctx.fillStyle = "#80af49";
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  ctx.fillStyle = "#ffaa00";
  for(var i in players) {
    drawObject(players[i]);
  }

  ctx.fillStyle = "#003300";
  for(var i in map) {
    drawObject(map[i]);
  }
}

function drawObject(p) {
  ctx.beginPath();

  ctx.moveTo(p.vertices[0].x - cam.x + cvs.width / 2, p.vertices[0].y - cam.y + cvs.height / 2);
  for(var i = 1; i < p.vertices.length; i++)
    ctx.lineTo(p.vertices[i].x - cam.x + cvs.width / 2, p.vertices[i].y - cam.y + cvs.height / 2);

  ctx.fill();
}
