function draw(delta){

  // Background gradient
  const bg_gradient = ctx.createLinearGradient(
    0, -cvs.height * 2.5 - cvs.height * (cam.y / 360),
    0, cvs.height * 2.5 - cvs.height * (cam.y / 360)
  );
  /*bg_gradient.addColorStop(-1, "#000");
  bg_gradient.addColorStop(-0.8, "#206");
  bg_gradient.addColorStop(-0.5, "#d22");*/
  bg_gradient.addColorStop(0, "#fb2");
  bg_gradient.addColorStop(0.5, "#4cf");
  bg_gradient.addColorStop(1, "#09f");

  // Healthbar gradient
  const healthbar_x = cvs.width / 2 - images.healthbar.width / 2;
  const healthbar_y = 20;
  const health_gradient = ctx.createLinearGradient(
    healthbar_x, 0,
    healthbar_x + images.healthbar.width, 0
  );
  health_gradient.addColorStop(0, "#f00");
  health_gradient.addColorStop(1, "#a00");

  // Fill the background
  ctx.fillStyle = bg_gradient;
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  // Draw the map
  ctx.fillStyle = OBJECT_COLOR;
  ctx.lineWidth = OBJECT_OUTLINE_WIDTH;
  ctx.fillStyle = OBJECT_COLOR;
  for(var i in map)
    drawObject(map[i], OBJECT_OUTLINE);

  // Draw the players
  ctx.strokeStyle = PLAYER_OUTLINE_COLOR;
  ctx.lineWidth = PLAYER_OUTLINE_WIDTH;
  ctx.fillStyle = PLAYER_COLOR;
  for(var i in players) {
    const p = players[i];
    drawObject(p, PLAYER_OUTLINE);

    const player_radius =
      Math.sqrt(
        Math.pow(p.vertices[0].x - players[i].x, 2) +
        Math.pow(p.vertices[0].y - players[i].y, 2)
      );
    const hand_angle = 2 * Math.PI * p.hand / 256;
    const xCoord = p.x - cam.x + cvs.width / 2;
    const yCoord = p.y - cam.y + cvs.height / 2;

    // Draw eyes
    ctx.drawImage(
      images.eyes,
      xCoord - player_radius,
      yCoord - player_radius,
      player_radius * 2,
      player_radius * 2
    );

    // Draw weapon
    ctx.save();
    ctx.translate(xCoord, yCoord);
    if(hand_angle < Math.PI / 2 || hand_angle > 3 * Math.PI / 2) {
      ctx.rotate(-hand_angle - 0.15);
      ctx.drawImage(images.pistol, player_radius, 0, 50, 50);
    } else {
      ctx.rotate(-3.14 - hand_angle);
      ctx.scale(-1, 1);
      ctx.drawImage(images.pistol, player_radius, 42, 50, -50);
    }
    ctx.restore();
  }

  // Draw bullets
  for (var i in bullets) {
    const b = bullets[i];
    drawBullet(b);
  }

  // Healthbar
  if(players.length > 0) {
    ctx.fillStyle = health_gradient;
    ctx.fillRect(healthbar_x + 28, healthbar_y + 5, 365 * players[0].health, 37);
    ctx.drawImage(images.healthbar, healthbar_x, healthbar_y);
  }
}

function drawBullet(b) {
  const bullet_angle = 2 * Math.PI * b.angle / 256;
  const xCoord = b.vertices[0].x - cam.x + cvs.width / 2;
  const yCoord = b.vertices[0].y - cam.y + cvs.height / 2;

  ctx.save();
  ctx.translate(xCoord, yCoord);
  ctx.rotate(-bullet_angle);
  ctx.drawImage(images.bullet, 0, 0);
  ctx.restore();
}

function drawObject(p, outline) {
  ctx.beginPath();

  const v0 = getVertexPosition(p.vertices[0]);
  ctx.moveTo(v0.x, v0.y);

  for(var i = 1; i < p.vertices.length; i++) {
    const v = getVertexPosition(p.vertices[i]);
    ctx.lineTo(v.x, v.y);
  }
  ctx.lineTo(v0.x, v0.y);

  ctx.fill();
  if(outline)
    ctx.stroke();
}

function getVertexPosition(v) {
  return {
    x: v.x - cam.x + cvs.width / 2,
    y: v.y - cam.y + cvs.height / 2
  }
}
