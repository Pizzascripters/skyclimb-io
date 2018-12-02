function draw(Game){
  const cvs = Game.cvs,
        ctx = Game.ctx,
        cam = Game.cam,
        players = Game.players,
        map = Game.map,
        bullets = Game.bullets,
        inventory = Game.inventory,
        items = Game.items,
        images = Game.images;

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
  const healthbar = {};
  healthbar.image = images.healthbar;
  healthbar.x = cvs.width / 2 - images.healthbar.width / 2;
  healthbar.y = 80;
  healthbar.gradient = ctx.createLinearGradient(
    healthbar.x, 0,
    healthbar.x + healthbar.image.width, 0
  );
  healthbar.gradient.addColorStop(0, "#f00");
  healthbar.gradient.addColorStop(1, "#a00");

  // Energybar gradient
  const energybar = {};
  energybar.image = images.energybar;
  energybar.x = cvs.width / 2 - images.energybar.width / 2;
  energybar.y = 130;
  energybar.gradient = ctx.createLinearGradient(
    energybar.x, 0,
    energybar.x + energybar.image.width, 0
  );
  energybar.gradient.addColorStop(0, "#fd0");
  energybar.gradient.addColorStop(1, "#b90");

  // Fill the background
  ctx.fillStyle = bg_gradient;
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  // Draw bullets
  for (var i in bullets) {
    const b = bullets[i];
    drawBullet(ctx, b, images.bullet, cam);
  }

  // Draw the map
  ctx.fillStyle = OBJECT_COLOR;
  ctx.lineWidth = OBJECT_OUTLINE_WIDTH;
  ctx.fillStyle = OBJECT_COLOR;
  for(var i in map)
    drawObject(ctx, cam, map[i], OBJECT_OUTLINE);

  // Draw the players
  ctx.strokeStyle = PLAYER_OUTLINE_COLOR;
  ctx.lineWidth = PLAYER_OUTLINE_WIDTH;
  ctx.fillStyle = PLAYER_COLOR;
  for(var i in players) {
    const p = players[i];
    drawPlayer(ctx, cam, p, PLAYER_OUTLINE);

    const xCoord = p.x - cam.x + cvs.width / 2;
    const yCoord = p.y - cam.y + cvs.height / 2;
    const handAngle = 2 * Math.PI * p.hand / 256;

    // Draw eyes
    ctx.drawImage(
      images.eyes,
      xCoord - p.radius,
      yCoord - p.radius,
      p.radius * 2,
      p.radius * 2
    );

    drawWeapon(
      ctx,
      {x: xCoord, y: yCoord, r: p.radius, hand: handAngle},
      items[p.weapon]
    );
  }

  if(players.length > 0) {
    drawHealthbar(ctx, players[0].health, healthbar);
    drawEnergyBar(ctx, players[0].energy, energybar);
    drawInventory(ctx, inventory, items);
  }
}

function drawWeapon(ctx, player, item){
  if(item.image === null) return 1;

  const xCoord = player.x,
        yCoord = player.y,
        playerRadius = player.r,
        handAngle = player.hand

  ctx.save();
  ctx.translate(xCoord, yCoord);
  if(handAngle < Math.PI / 2 || handAngle > 3 * Math.PI / 2) {
    ctx.rotate(-handAngle - 0.15);
    ctx.drawImage(item.image, playerRadius + item.radialShift, 0, item.width, item.height);
  } else {
    ctx.rotate(0.15 - Math.PI - handAngle);
    ctx.scale(-1, 1);
    ctx.drawImage(item.image, playerRadius + item.radialShift, 42, item.width, -item.height);
  }
  ctx.restore();
}

function drawBullet(ctx, b, image, cam) {
  const bullet_angle = 2 * Math.PI * b.angle / 256;
  const xCoord = b.vertices[0].x - cam.x + cvs.width / 2;
  const yCoord = b.vertices[0].y - cam.y + cvs.height / 2;

  ctx.save();
  ctx.translate(xCoord, yCoord);
  ctx.rotate(-bullet_angle);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function drawPlayer(ctx, cam, p, outline) {
  const v = getVertexPosition(p, cam);
  ctx.beginPath();
  ctx.arc(v.x, v.y, p.radius, 0, 2 * Math.PI);

  ctx.fill();
  if(outline)
    ctx.stroke();
}

function drawObject(ctx, cam, p, outline) {
  const v0 = getVertexPosition(p.vertices[0], cam);

  ctx.beginPath();
  ctx.moveTo(v0.x, v0.y);

  for(var i = 1; i < p.vertices.length; i++) {
    const v = getVertexPosition(p.vertices[i], cam);
    ctx.lineTo(v.x, v.y);
  }
  ctx.lineTo(v0.x, v0.y);

  ctx.fill();
  if(outline)
    ctx.stroke();
}

function drawHealthbar(ctx, health, healthbar){
  ctx.fillStyle = healthbar.gradient;
  ctx.fillRect(healthbar.x + 28, healthbar.y + 5, 365 * health, 37);
  ctx.drawImage(healthbar.image, healthbar.x, healthbar.y);
}

function drawEnergyBar(ctx, energy, energybar){
  ctx.fillStyle = energybar.gradient;
  ctx.fillRect(energybar.x + 5, energybar.y + 5, 289 * energy, 20);
  ctx.drawImage(energybar.image, energybar.x, energybar.y);
}

function drawInventory(ctx, inventory, items){
  ctx.fillStyle = "#888";
  ctx.globalAlpha = 0.8;

  roundRect(ctx, cvs.width / 2 - 170, -10, 100, inventory.anim[3], 10, true, false);
  roundRect(ctx, cvs.width / 2 - 50, -10, 100, inventory.anim[4], 10, true, false);
  roundRect(ctx, cvs.width / 2 + 70, -10, 100, inventory.anim[5], 10, true, false);

  drawItem(ctx, cvs.width / 2 - 120, 100, inventory.anim[3], items[inventory.items[3]]);
  drawItem(ctx, cvs.width / 2,       100, inventory.anim[4], items[inventory.items[4]]);
  drawItem(ctx, cvs.width / 2 + 120, 100, inventory.anim[5], items[inventory.items[5]]);

  ctx.globalAlpha = 1;
}

function drawItem(ctx, x, w, anim, item) {
  if(item.image) {
    const width = w - 20;
    const height = width * item.image.height / item.image.width;
    ctx.drawImage(item.image, x - width/2, anim - height - 20, width, height);
  }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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

function getVertexPosition(v, cam) {
  return {
    x: v.x - cam.x + cvs.width / 2,
    y: v.y - cam.y + cvs.height / 2
  }
}
