function draw(Game){
  const cvs = Game.cvs,
        ctx = Game.ctx,
        cam = Game.cam,
        players = Game.players,
        keyboard = Game.keyboard,
        map = Game.map,
        bullets = Game.bullets,
        throwables = Game.throwables,
        loot = Game.loot,
        inventory = Game.inventory,
        items = Game.items,
        shopMenu = Game.shopMenu,
        flames = Game.flames,
        snow = Game.snow,
        images = Game.images;

  const bg_gradient = getBackgroundGradient(ctx, cam);
  const healthbar = createHealthbar(ctx, images.healthbar);
  const energybar = createEnergybar(ctx, images.energybar);

  // Fill the background
  ctx.fillStyle = bg_gradient;
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  drawBackground(ctx, cam, images.backgrounds.sunset, images.backgrounds.stars, snow);

  for(var i in map.shops)
    drawShop(ctx, map.shops[i], images.shops, cam);
  for (var i in bullets) {
    drawBullet(ctx, bullets[i], cam);
  }
  ctx.fillStyle = "#040";
  for (var i in throwables)
    drawThrowable(ctx, throwables[i], images.items.nade, cam);

  // Draw the players
  for(var i in players) {
    drawJetpack(ctx, cam, players[i], images.jetpack);
    drawFlame(ctx, cam, players[i], flames[players[i].name]);
    drawPlayer(ctx, cam, players[i], PLAYER_OUTLINE, images.eyes.generic, items[players[i].weapon]);
  }

  // Draw the map
  for(var i in map.objects) {
    drawObject(ctx, cam, map.objects[i], images.textures);
  }
  for(var i in map.decoration) {
    drawDecoration(ctx, cam, map.decoration[i]);
  }
  drawWater(ctx, cam, map.waterHeight, images.textures.water);

  drawLoot(ctx, loot, cam);
  for(var i in players)
    drawName(ctx, cam, players[i]);

  ctx.save();
  ctx.scale((cvs.width / FRAME_WIDTH), (cvs.width / FRAME_WIDTH));
  if(players.length > 0 && !Game.spectating) {
    drawHealthbar(ctx, players[0].health, healthbar);
    drawEnergyBar(ctx, players[0].energy, energybar);
    drawInventory(ctx, inventory, items);
    drawStats(ctx, images.stats, players[0].gold, players[0].kills, players[0].score, players[0].bullets, players[0].shells);
    drawLeaderboard(ctx, Game.leaderboard, images.stats.score);
  }
  ctx.restore();

  if(shopMenu.length > 0) {
    drawShopMenu(ctx, shopMenu, images.shops[shopMenu[0]], keyboard, images.stats.gold);
  }
}

function getBackgroundGradient(ctx, cam) {
  const range = GREATEST_Y_VALUE - LEAST_Y_VALUE;
  const scale = (GREATEST_Y_VALUE - cam.y) / range;
  const bg_gradient = ctx.createLinearGradient(
    0, scale * range - range,
    0, scale * range - range + range
  );
  bg_gradient.addColorStop(1 - BIOME_STARRY, "#000");
  bg_gradient.addColorStop(1 - BIOME_SNOWY, "#206");
  bg_gradient.addColorStop(1 - (BIOME_SNOWY + BIOME_SUNSET)/2, "#d22");
  bg_gradient.addColorStop(1 - BIOME_SUNSET, "#fb2");
  return bg_gradient;
}

function createHealthbar(ctx, image) {
  const healthbar = {};
  healthbar.image = image;
  healthbar.x = FRAME_WIDTH / 2 - image.width / 2;
  healthbar.y = 80;
  healthbar.gradient = ctx.createLinearGradient(
    healthbar.x, 0,
    healthbar.x + image.width, 0
  );
  healthbar.gradient.addColorStop(0, "#f00");
  healthbar.gradient.addColorStop(1, "#a00");
  return healthbar;
}

function createEnergybar(ctx, image) {
  const energybar = {};
  energybar.image = image;
  energybar.x = FRAME_WIDTH / 2 - image.width / 2;
  energybar.y = 130;
  energybar.gradient = ctx.createLinearGradient(
    energybar.x, 0,
    energybar.x + image.width, 0
  );
  energybar.gradient.addColorStop(0, "#fd0");
  energybar.gradient.addColorStop(1, "#b90");
  return energybar;
}

function drawBackground(ctx, cam, sunset, stars, snow) {
  const range = GREATEST_Y_VALUE - LEAST_Y_VALUE;
  const scale = (GREATEST_Y_VALUE - cam.y) / range;

  // Sunset
  let y = cvs.height * scale / BIOME_SNOWY
  if(y < 0) y = 0;
  ctx.drawImage(sunset, 0, y, cvs.width, cvs.height);

  // Snow
  if(scale > BIOME_SNOWY && scale < BIOME_STARRY) {
    ctx.globalAlpha = -10*(scale - BIOME_STARRY)*(scale - BIOME_SNOWY); // Parabola
    for(var i in snow) {
      snow[i].render(ctx);
    }
    ctx.globalAlpha = 1;
  }

  // Stars
  if(scale > BIOME_STARRY) {
    ctx.globalAlpha = 5*(scale - BIOME_STARRY);
    ctx.drawImage(stars, 0, 0, cvs.width, cvs.height);
    ctx.globalAlpha = 1;
  }
}

function drawWeapon(ctx, p, item, radius) {
  if(item.image === null) return 1;

  ctx.save();
  ctx.translate(p.x, p.y);
  if(p.hand < Math.PI / 2 || p.hand > 3 * Math.PI / 2) {
    ctx.rotate(-p.hand);
  } else {
    ctx.rotate(-Math.PI-p.hand);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    item.image,
    radius + item.radialShift * (cvs.width / FRAME_WIDTH),
    -item.height * (cvs.width / FRAME_WIDTH) / 2,
    item.width * (cvs.width / FRAME_WIDTH),
    item.height * (cvs.width / FRAME_WIDTH)
  );

  ctx.restore();
}

function drawBullet(ctx, b, cam) {
  const bullet_angle = 2 * Math.PI * b.angle / 256;
  const v = getVertexPosition(b, cam);
  const zoom = cvs.width / FRAME_WIDTH;

  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(-bullet_angle);
  ctx.drawImage(b.image, 0, 0, 20 * zoom, 10 * zoom);
  ctx.restore();
}

function drawThrowable(ctx, t, image, cam) {
  const angle = 2 * Math.PI * t.angle / 256;
  const v = getVertexPosition(t, cam);

  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(angle);
  ctx.drawImage(image, -t.width/2, -t.height/2, t.width, t.height);
  ctx.restore();
}

function drawJetpack(ctx, cam, p, jetpack) {
  const v = getVertexPosition(p, cam)
        width = jetpack.width * cvs.width / FRAME_WIDTH,
        height = jetpack.height * cvs.width / FRAME_WIDTH;
  ctx.drawImage(jetpack, v.x - width/2, v.y - height/2, width, height);
}

function drawFlame(ctx, cam, p, flame) {
  const v = getVertexPosition(p, cam);
  if(flame) {
    flame.update();
    flame.render(ctx, v.x, v.y + 60 * cvs.width / FRAME_WIDTH);
  }
}

function drawPlayer(ctx, cam, p, outline, eyes, weapon) {
  const v = getVertexPosition(p, cam),
        handAngle = 2 * Math.PI * p.hand / 256,
        radius = p.radius * cvs.width / FRAME_WIDTH;

  ctx.strokeStyle = PLAYER_OUTLINE_COLOR;
  ctx.lineWidth = PLAYER_OUTLINE_WIDTH * (cvs.width / FRAME_WIDTH);
  ctx.fillStyle = PLAYER_COLOR;

  ctx.beginPath();
  ctx.arc(v.x, v.y, radius, 0, 2 * Math.PI);
  ctx.fill();
  if(outline)
    ctx.stroke();

  // Draw eyes
  ctx.drawImage(
    eyes,
    v.x - radius,
    v.y - radius,
    radius * 2,
    radius * 2
  );

  drawWeapon(
    ctx,
    {x: v.x, y: v.y, r: radius, hand: handAngle},
    weapon,
    radius
  );
}

function drawObject(ctx, cam, p, textures) {
  const zoom = cvs.width / FRAME_WIDTH;
  const size = 3 * zoom;

  // Stone Pattern
  const offset = {
    x: -(zoom * cam.x % (size * MOUNTAIN_TEXURE_WIDTH)),
    y: -(zoom * cam.y % (size * MOUNTAIN_TEXURE_HEIGHT))
  }

  /*ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x + cvs.width/2, -cam.y + cvs.height / 2);
  ctx.scale(size, size);
  ctx.fillStyle = ctx.createPattern(textures.rock, "repeat");

  ctx.beginPath();
  ctx.moveTo(p.vertices[0].x / size, p.vertices[0].y / size);
  for(var i = 1; i < p.vertices.length; i++) {
    ctx.lineTo(p.vertices[i].x / size, p.vertices[i].y / size);
  }
  ctx.lineTo(p.vertices[0].x / size, p.vertices[0].y / size);
  ctx.fill();
  ctx.restore();*/

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(size, size);
  ctx.fillStyle = ctx.createPattern(textures.rock, "repeat");

  var v0 = getVertexPosition(p.vertices[0], cam);
  ctx.beginPath();
  v0.x = (v0.x - offset.x) / size;
  v0.y = (v0.y - offset.y) / size;
  ctx.moveTo(v0.x, v0.y);
  for(var i = 1; i < p.vertices.length; i++) {
    var v = getVertexPosition(p.vertices[i], cam);
    v.x = (v.x - offset.x) / size;
    v.y = (v.y - offset.y) / size;
    ctx.lineTo(v.x, v.y);
  }
  ctx.lineTo(v0.x, v0.y);
  ctx.fill();
  ctx.restore();

  // Outline
  if(OBJECT_OUTLINE) {
    var v0 = getVertexPosition(p.vertices[0], cam);
    ctx.beginPath();
    ctx.moveTo(v0.x, v0.y);
    for(var i = 1; i < p.vertices.length; i++) {
      var v = getVertexPosition(p.vertices[i], cam);
      ctx.lineTo(v.x, v.y);
    }
    ctx.lineTo(v0.x, v0.y);
    ctx.lineWidth = OBJECT_OUTLINE_WIDTH;
    ctx.stroke();
  }

  // Draw grass & snow
  var newv = v0 = getVertexPosition(p.vertices[0], cam);
  for(var i = 1; i < p.vertices.length; i++) {
    oldv = newv;
    newv = getVertexPosition(p.vertices[i], cam);
    angle = Math.atan2(newv.y - oldv.y, newv.x - oldv.x);

    if(p.vertices[i].surface) {
      ctx.save();
      ctx.translate(oldv.x, oldv.y);
      ctx.scale(cvs.width / FRAME_WIDTH, cvs.width / FRAME_WIDTH);
      ctx.rotate(angle);
      var surface = p.vertices[i].surface;

      if(surface.type === "grass" || surface.type === "midnight") {
        // Dark grass
        ctx.fillStyle = "#050";
        if(surface.type === "midnight") {
          ctx.fillStyle = "#021";
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        surface.dark.forEach(vertex => {
          ctx.lineTo(vertex.x, vertex.y);
        });
        ctx.fill();

        // Light grass
        ctx.fillStyle = "#693";
        if(surface.type === "midnight") {
          ctx.fillStyle = "#242";
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        surface.light.forEach(vertex => {
          ctx.lineTo(vertex.x, vertex.y);
        });
        ctx.fill();
      } else if(surface.type === "snow") {
        // Dark snow
        ctx.fillStyle = "#bbb";
        surface.dark.forEach(circle => {
          ctx.beginPath();
          ctx.arc(circle.pos, 0, circle.radius, 0, Math.PI);
          ctx.fill();
        });

        // Light snow
        ctx.fillStyle = "#fff";
        surface.light.forEach(circle => {
          ctx.beginPath();
          ctx.arc(circle.pos, 0, circle.radius, 0, Math.PI);
          ctx.fill();
        });
      }

      ctx.restore();
    }
  }
}

function drawDecoration(ctx, cam, d) {
  const v = getVertexPosition(d, cam);
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(d.angle);
  ctx.drawImage(d.img, 0, -d.img.height);
  ctx.restore();
}

function drawLoot(ctx, loot, cam) {
  ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
  ctx.strokeStyle = "2px solid black";
  ctx.lineWidth = 2;

  for(var i in loot) {
    const l = loot[i];
    const v = getVertexPosition(l, cam)

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(2 * Math.PI * l.angle / 255);
    ctx.beginPath();
    ctx.arc(0, 0, (cvs.width / FRAME_WIDTH) * l.radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

    if(l.item.image !== null) {
      const width = (cvs.width / FRAME_WIDTH) * (l.radius * 2 - 10);
      const height = l.item.image.height * width / l.item.image.width;
      ctx.drawImage(l.item.image, -width/2, -height/2, width, height);
    }

    ctx.restore();
  }
}

function drawName(ctx, cam, p) {
  const v = getVertexPosition(p, cam);

  ctx.fillStyle = "#fff";
  ctx.font = "20px Play";
  ctx.fillText(p.name, v.x - ctx.measureText(p.name).width / 2, v.y - p.radius - 20);
}

function drawWater(ctx, cam, waterLevel, image) {
  const v = getVertexPosition({x: 0, y: waterLevel}, cam);
  const y = v.y > -image.height ? v.y : -image.height;

  // Draw the bottomless ocean
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#14f";
  ctx.fillRect(0, y + image.height - 2, cvs.width, cvs.height + image.height + 2);
  ctx.globalAlpha = 1;

  // Draw the texture on top
  let offset = -(cam.x % image.width);
  if(cam.x < 0)
    offset = -(cam.x % image.width) - image.width;
  ctx.save();
  ctx.translate(offset, v.y);
  ctx.fillStyle = ctx.createPattern(image, "repeat");
  ctx.beginPath();
  ctx.rect(0, 0, cvs.width + image.width * 2, image.height);
  ctx.fill();
  ctx.restore();
}

function drawShop(ctx, shop, shopImages, cam) {
  const v = getVertexPosition({x: shop.x, y: shop.y}, cam);

  ctx.drawImage(shopImages[shop.type].outside, v.x, v.y, shop.width * cvs.width / FRAME_WIDTH, shop.height * cvs.width / FRAME_WIDTH);
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

  roundRect(ctx, FRAME_WIDTH / 2 - 340, -10, 100, inventory.anim[0]);
  roundRect(ctx, FRAME_WIDTH / 2 - 220, -10, 100, inventory.anim[1]);
  roundRect(ctx, FRAME_WIDTH / 2 - 100, -10, 100, inventory.anim[2]);
  roundRect(ctx, FRAME_WIDTH / 2 + 100, -10, 100, inventory.anim[3]);
  roundRect(ctx, FRAME_WIDTH / 2 + 220, -10, 100, inventory.anim[4]);
  roundRect(ctx, FRAME_WIDTH / 2 + 340, -10, 100, inventory.anim[5]);

  drawItem(ctx, 0, items[inventory.items[0]], inventory.anim[0]);
  drawItem(ctx, 1, items[inventory.items[1]], inventory.anim[1]);
  drawItem(ctx, 2, items[inventory.items[2]], inventory.anim[2]);
  drawItem(ctx, 3, items[inventory.items[3]], inventory.anim[3], inventory.amt[0]);
  drawItem(ctx, 4, items[inventory.items[4]], inventory.anim[4], inventory.amt[1]);
  drawItem(ctx, 5, items[inventory.items[5]], inventory.anim[5], inventory.amt[2]);

  ctx.globalAlpha = 1;
}

function drawItem(ctx, slot, item, anim, amt) {
  if(!item.image) return;

  // Find appropraite width and height for drawing
  const MAXWIDTH = 80;
  const MAXHEIGHT = slot > 2 ? 30 : 60;
  const ratio = item.image.width / item.image.height;
  if(MAXWIDTH / ratio > MAXHEIGHT) {
    height = MAXHEIGHT;
    width = height * ratio;
  } else {
    width = MAXWIDTH;
    height = width / ratio;
  }
  if(slot <= 2) {
    y = anim - height - 20;
  } else {
    y = anim - height - 40;
  }

  switch(slot) {
    case 0:
      x = FRAME_WIDTH / 2 - 290 - width / 2;
      break;
    case 1:
      x = FRAME_WIDTH / 2 - 170 - width / 2;
      break;
    case 2:
      x = FRAME_WIDTH / 2 - 50 - width / 2;
      break;
    case 3:
      x = FRAME_WIDTH / 2 + 150 - width / 2;
      break;
    case 4:
      x = FRAME_WIDTH / 2 + 270 - width / 2;
      break;
    case 5:
      x = FRAME_WIDTH / 2 + 390 - width / 2;
      break;
  }

  ctx.drawImage(item.image, x, y, width, height);
  if(slot > 2) {
    var savedStyle = ctx.fillStyle;
    var savedOpacity = ctx.globalAlpha;
    ctx.fillStyle = "#fff";
    ctx.font = "24px Play";
    ctx.globalAlpha = 1;
    ctx.fillText(amt, x - ctx.measureText(amt).width / 2 + width / 2, y + 50)
    ctx.fillStyle = savedStyle;
    ctx.globalAlpha = savedOpacity;
  }
}

function drawStats(ctx, images, gold, kills, score, bullets, shells) {
  ctx.fillStyle = "#888";
  ctx.globalAlpha = 0.8;
  roundRect(ctx, 20, 20, STATS_WIDTH, STATS_HEIGHT, 10, true, false)
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#fff";
  ctx.font = "50px Play";
  ctx.fillText(
    "Stats",
    20 + STATS_WIDTH/2 - ctx.measureText("Stats").width/2,
    80
  );

  ctx.drawImage(images.kills, 30, 100, 30, 30);
  ctx.drawImage(images.gold, 30, 140, 30, 30);
  ctx.drawImage(images.score, 30, 180, 30, 30);
  ctx.drawImage(images.bullets, 30, 220, 30, 30);
  ctx.drawImage(images.shells, 30, 260, 30, 30);

  ctx.font = "30px Play";
  ctx.fillText(kills, 80, 130);
  ctx.fillText(gold, 80, 170);
  ctx.fillText(score, 80, 210);
  ctx.fillText(bullets, 80, 250);
  ctx.fillText(shells, 80, 290);
}

function drawLeaderboard(ctx, leaderboard, scoreImage) {
  ctx.fillStyle = "#888";
  ctx.globalAlpha = 0.8;
  roundRect(ctx, FRAME_WIDTH - 20 - LEADERBOARD_WIDTH, 20, LEADERBOARD_WIDTH, LEADERBOARD_HEIGHT, 10, true, false)
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#fff";
  ctx.font = "30px Play";
  ctx.fillText(
    "Leaderboard",
    FRAME_WIDTH - 20 - LEADERBOARD_WIDTH/2 - ctx.measureText("Leaderboard").width/2,
    60
  );

  for(var i in leaderboard) {
    ctx.font = "24px Play";
    var text = (Number(i)+1) + ". ";
    ctx.fillText(text, FRAME_WIDTH - LEADERBOARD_WIDTH, 90 + 30*i);

    ctx.font = "1px Play"
    text = leaderboard[i].name
    var fontsize = 120 / ctx.measureText(text).width;
    fontsize = Math.floor(fontsize);
    if(fontsize > 30) fontsize = 30;
    ctx.font = fontsize + "px Play";
    ctx.fillText(text, FRAME_WIDTH - LEADERBOARD_WIDTH + 30, 90 + 30*i);

    text = leaderboard[i].score;
    ctx.drawImage(scoreImage, FRAME_WIDTH - 70, 66 + 30*i, 30, 30)
    ctx.font = "18px Play";
    ctx.fillText(text, FRAME_WIDTH - 80 - ctx.measureText(text).width, 90 + 30*i);
  }
}

function drawShopMenu(ctx, shopMenu, shopImages, keyboard, goldImage) {
  const width = cvs.width / 2;
  const height = 9 * width / 16;

  // Draw shop backgrounds
  ctx.drawImage(shopImages.inside, (cvs.width - width) / 2, (cvs.height - height) / 2, width / 2, height);
  ctx.drawImage(shopImages.shelf, cvs.width / 2, (cvs.height - height) / 2, width / 2, height);

  // Draw Shelf
  shopMenuApply(shopMenu, (item, rect) => {
    if(item.id < 128 && (keyboard.buy10 || keyboard.buy100)) return false;

    const size = width / 8;
    const margin = SHOP_MENU_MARGIN;
    const padding = SHOP_MENU_PADDING;
    const textHeight = Math.floor(20 * (cvs.width / FRAME_WIDTH));
    const pos = {
      x: rect.x - margin,
      y: rect.y - margin
    }

    if(insideRect(mouse, rect)) {
      ctx.globalAlpha = 0.6;
      if(mouse.down) {
        ctx.fillStyle = "#999";
      } else {
        ctx.fillStyle = "#aaa";
      }
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.globalAlpha = 1;
      cvs.style.cursor = "pointer";
    }

    const scale = (size / 3) / item.image.width;
    ctx.drawImage(
      item.image,
      pos.x + size / 2 - scale * item.image.width / 2,
      pos.y + size / 2 - scale * item.image.height / 2,
      scale * item.image.width,
      scale * item.image.height
    );

    ctx.fillStyle = "#fff";
    ctx.font = textHeight + "px Play";
    ctx.fillText(
      item.name,
      pos.x + (size - ctx.measureText(item.name).width) / 2,
      pos.y + textHeight + margin + padding
    );

    var price = item.price;
    if(keyboard.buy10) {
      price *= 10;
    } else if(keyboard.buy100) {
      price *= 100;
    }
    ctx.fillText(
      price,
      pos.x + (size - ctx.measureText(price).width - SHOP_GOLD_IMAGE_WIDTH) / 2 - 5,
      pos.y + size - margin - padding
    );
    ctx.drawImage(
      goldImage,
      pos.x + (size + ctx.measureText(price).width - SHOP_GOLD_IMAGE_WIDTH) / 2 + 5,
      pos.y + size - margin - padding - SHOP_GOLD_IMAGE_HEIGHT / 2,
      SHOP_GOLD_IMAGE_WIDTH, SHOP_GOLD_IMAGE_HEIGHT
    );
  });

  // Outline
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo((cvs.width - width) / 2, (cvs.height - height) / 2);
  ctx.lineTo((cvs.width + width) / 2, (cvs.height - height) / 2);
  ctx.lineTo((cvs.width + width) / 2, (cvs.height + height) / 2);
  ctx.lineTo((cvs.width - width) / 2, (cvs.height + height) / 2);
  ctx.lineTo((cvs.width - width) / 2, (cvs.height - height) / 2);
  ctx.stroke();
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
  const zoom = cvs.width / FRAME_WIDTH;

  return {
    x: (v.x - cam.x) * zoom + cvs.width / 2,
    y: (v.y - cam.y) * zoom + cvs.height / 2
  }
}
