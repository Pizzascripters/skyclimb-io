function draw(){
  // Background gradient
  const range = GREATEST_Y_VALUE - LEAST_Y_VALUE;
  const scale = (GREATEST_Y_VALUE - cam.y) / range;
  const bg_gradient = ctx.createLinearGradient(
    0, scale * cvs.height * 5 - cvs.height * 5,
    0, scale * cvs.height * 5 - cvs.height * 5 + cvs.height * 5
  );
  bg_gradient.addColorStop(0, "#000");
  bg_gradient.addColorStop(0.1, "#206");
  bg_gradient.addColorStop(0.2, "#d22");
  bg_gradient.addColorStop(0.4, "#fb2");
  bg_gradient.addColorStop(0.6, "#4cf");
  bg_gradient.addColorStop(1, "#09f");

  // Healthbar gradient
  const healthbarX = cvs.width / 2 - images.healthbar.width / 2;
  const healthbarY = 80;
  const healthGradient = ctx.createLinearGradient(
    healthbarX, 0,
    healthbarX + images.healthbar.width, 0
  );
  healthGradient.addColorStop(0, "#f00");
  healthGradient.addColorStop(1, "#a00");

  // Energybar gradient
  const energybarX = cvs.width / 2 - images.energybar.width / 2;
  const energybarY = 130;
  const energyGradient = ctx.createLinearGradient(
    energybarX, 0,
    energybarX + images.energybar.width, 0
  );
  energyGradient.addColorStop(0, "#fd0");
  energyGradient.addColorStop(1, "#b90");

  // Fill the background
  ctx.fillStyle = bg_gradient;
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  // Draw bullets
  for (var i in bullets) {
    const b = bullets[i];
    drawBullet(b);
  }

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

    const xCoord = p.x - cam.x + cvs.width / 2;
    const yCoord = p.y - cam.y + cvs.height / 2;
    const playerRadius =
      Math.sqrt(
        Math.pow(p.vertices[0].x - players[i].x, 2) +
        Math.pow(p.vertices[0].y - players[i].y, 2)
      );
    const handAngle = 2 * Math.PI * p.hand / 256;

    // Draw eyes
    ctx.drawImage(
      images.eyes,
      xCoord - playerRadius,
      yCoord - playerRadius,
      playerRadius * 2,
      playerRadius * 2
    );

    drawWeapon(xCoord, yCoord, playerRadius, handAngle, p.weapon);
  }

  drawHealthbar(healthGradient, healthbarX, healthbarY);
  drawEnergyBar(energyGradient, energybarX, energybarY);
  drawInventory();
}

function drawWeapon(xCoord, yCoord, playerRadius, handAngle, weapon){
  ctx.save();
  ctx.translate(xCoord, yCoord);
  if(handAngle < Math.PI / 2 || handAngle > 3 * Math.PI / 2) {
    ctx.rotate(-handAngle - 0.15);
    if(weapon === 1)
      ctx.drawImage(images.pistol, playerRadius, 0, 50, 50);
  } else {
    ctx.rotate(0.15 - Math.PI - handAngle);
    ctx.scale(-1, 1);
    if(weapon === 1)
      ctx.drawImage(images.pistol, playerRadius, 42, 50, -50);
  }
  ctx.restore();
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

function drawHealthbar(healthGradient, healthbarX, healthbarY){
  if(players.length > 0) {
    ctx.fillStyle = healthGradient;
    ctx.fillRect(healthbarX + 28, healthbarY + 5, 365 * players[0].health, 37);
    ctx.drawImage(images.healthbar, healthbarX, healthbarY);
  }
}

function drawEnergyBar(energyGradient, energybarX, energybarY){
  if(players.length > 0) {
    ctx.fillStyle = energyGradient;
    ctx.fillRect(energybarX + 5, energybarY + 5, 289 * players[0].energy, 20);
    ctx.drawImage(images.energybar, energybarX, energybarY);
  }
}

function drawInventory(){
  ctx.fillStyle = "#888";
  ctx.globalAlpha = 0.8;

  roundRect(cvs.width / 2 - 170, -10, 100, inventory.anim[3], 10, true, false);
  roundRect(cvs.width / 2 - 50, -10, 100, inventory.anim[4], 10, true, false);
  roundRect(cvs.width / 2 + 70, -10, 100, inventory.anim[5], 10, true, false);

  drawItem(cvs.width / 2 - 120, 100, inventory.anim[3], items[inventory.items[3]]);
  drawItem(cvs.width / 2,       100, inventory.anim[4], items[inventory.items[4]]);
  drawItem(cvs.width / 2 + 120, 100, inventory.anim[5], items[inventory.items[5]]);

  ctx.globalAlpha = 1;
}

function drawItem(x, w, anim, item) {
  const side = w - 20;
  if(item.image)
    ctx.drawImage(item.image, x - side/2, anim - side - 10, side, side);
}

function roundRect(x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined')
    stroke = true;
  if (typeof radius === 'undefined')
    radius = 5;
  if (typeof radius === 'number')
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius)
      radius[side] = radius[side] || defaultRadius[side];
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();

  if (fill)
    ctx.fill();
  if (stroke)
    ctx.stroke();
}

function getVertexPosition(v) {
  return {
    x: v.x - cam.x + cvs.width / 2,
    y: v.y - cam.y + cvs.height / 2
  }
}
