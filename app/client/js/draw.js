function draw(Game){
  const cvs = Game.cvs,
        ctx = Game.ctx,
        cam = Game.cam,
        players = Game.players,
        map = Game.map,
        bullets = Game.bullets,
        throwables = Game.throwables,
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

  // Draw Throwables
  ctx.fillStyle = "#040"
  for (var i in throwables) {
    const t = throwables[i];
    drawThrowable(ctx, t, images.nade, cam);
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
    drawStats(ctx, players[0].gold, players[0].kills, players[0].score);
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

function drawThrowable(ctx, t, image, cam) {
  const angle = 2 * Math.PI * t.angle / 256;
  const xCoord = t.x - cam.x + cvs.width / 2;
  const yCoord = t.y - cam.y + cvs.height / 2;

  ctx.save();
  ctx.translate(xCoord, yCoord);
  ctx.rotate(angle);
  ctx.drawImage(image, -t.width/2, -t.height/2, t.width, t.height);
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

  roundRect(ctx, cvs.width / 2 - 280, 5, 100, 30, 10);
  roundRect(ctx, cvs.width / 2 - 280, 40, 100, 30, 10);

  roundRect(ctx, cvs.width / 2 - 170, -10, 100, inventory.anim[2]);
  roundRect(ctx, cvs.width / 2 - 50, -10, 100, inventory.anim[3]);
  roundRect(ctx, cvs.width / 2 + 70, -10, 100, inventory.anim[4]);

  roundRect(ctx, cvs.width / 2 + 180, 5, 100, 30, 10);
  roundRect(ctx, cvs.width / 2 + 180, 40, 100, 30, 10);

  drawItem(ctx, cvs.width, 0, items[inventory.items[0]]);
  drawItem(ctx, cvs.width, 1, items[inventory.items[1]]);

  drawItem(ctx, cvs.width, 2, items[inventory.items[2]], inventory.anim[2]);
  drawItem(ctx, cvs.width, 3, items[inventory.items[3]], inventory.anim[3]);
  drawItem(ctx, cvs.width, 4, items[inventory.items[4]], inventory.anim[4]);

  drawItem(ctx, cvs.width, 0, items[inventory.items[5]]);
  drawItem(ctx, cvs.width, 1, items[inventory.items[6]]);

  ctx.globalAlpha = 1;
}

function drawItem(ctx, cvswidth, slot, item, anim) {
  if(!item.image) return;

  switch(slot) {
    case 0:
    case 1:
      x = cvs.width / 2 - 275;
      break;
    case 2:
      x = cvswidth / 2 - 160;
      break;
    case 3:
      x = cvswidth / 2 - 40;
      break;
    case 4:
      x = cvswidth / 2 + 80;
      break;
    case 5:
    case 6:
      x = cvs.width / 2 - 185;
      break;
  }

  switch(slot) {
    case 0:
    case 5:
      width = 20;
      height = width * item.image.height / item.image.width;
      y = 30 - height;
      break;
    case 1:
    case 6:
      width = 20;
      height = width * item.image.height / item.image.width;
      y = 30 - height;
      break;
    case 2:
    case 3:
    case 4:
      width = 80;
      height = width * item.image.height / item.image.width;
      y = anim - height - 20;
      break;
  }

  ctx.drawImage(item.image, x, y, width, height);
}

function drawStats(ctx, gold, kills, score) {
  ctx.fillStyle = "#888";
  ctx.globalAlpha = 0.8;
  roundRect(ctx, cvs.width - 20 - STATS_WIDTH, cvs.height - 20 - STATS_HEIGHT, STATS_WIDTH, STATS_HEIGHT, 10, true, false)
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#fff";
  ctx.font = "50px Arial";
  ctx.fillText(
    "Stats",
    cvs.width - 20 - STATS_WIDTH/2 - ctx.measureText("Stats").width/2,
    cvs.height - STATS_HEIGHT + 30
  );

  ctx.font = "30px Arial";
  ctx.fillText(
    "Kills",
    cvs.width - STATS_WIDTH,
    cvs.height - STATS_HEIGHT + 80
  );
  ctx.fillText(
    kills,
    cvs.width - 40 - ctx.measureText(kills).width,
    cvs.height - STATS_HEIGHT + 80
  );
  ctx.fillText(
    "Gold",
    cvs.width - STATS_WIDTH,
    cvs.height - STATS_HEIGHT + 120
  );
  ctx.fillText(
    gold,
    cvs.width - 40 - ctx.measureText(gold).width,
    cvs.height - STATS_HEIGHT + 120
  );
  ctx.font = "30px Arial";
  ctx.fillText(
    "Score",
    cvs.width - STATS_WIDTH,
    cvs.height - STATS_HEIGHT + 160
  );
  ctx.fillText(
    score,
    cvs.width - 40 - ctx.measureText(score).width,
    cvs.height - STATS_HEIGHT + 160
  );
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'undefined')
    radius = 10;
  if (typeof radius === 'number')
    radius = {tl: radius, tr: radius, br: radius, bl: radius};

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

  ctx.fill();
}

function getVertexPosition(v, cam) {
  return {
    x: v.x - cam.x + cvs.width / 2,
    y: v.y - cam.y + cvs.height / 2
  }
}