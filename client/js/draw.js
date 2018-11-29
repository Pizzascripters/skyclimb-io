const PLAYER_COLOR = "#fc7";
const OBJECT_COLOR = "#655";
const PLAYER_OUTLINE = true;
const PLAYER_OUTLINE_COLOR = "#000";
const PLAYER_OUTLINE_WIDTH = 3;
const OBJECT_OUTLINE = true;
const OBJECT_OUTLINE_COLOR = "#000";
const OBJECT_OUTLINE_WIDTH = 2;

function draw(delta){
  var bg_gradient = ctx.createLinearGradient(
    0, -cvs.height * 2.5 - cvs.height * (cam.y / 360),
    0, cvs.height * 2.5 - cvs.height * (cam.y / 360)
  );
  /*bg_gradient.addColorStop(-1, "#000");
  bg_gradient.addColorStop(-0.8, "#206");
  bg_gradient.addColorStop(-0.5, "#d22");*/
  bg_gradient.addColorStop(0, "#fb2");
  bg_gradient.addColorStop(0.5, "#4cf");
  bg_gradient.addColorStop(1, "#09f");

  ctx.fillStyle = bg_gradient;
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  ctx.fillStyle = OBJECT_COLOR;
  ctx.lineWidth = OBJECT_OUTLINE_WIDTH;
  ctx.fillStyle = OBJECT_COLOR;
  for(var i in map) drawObject(map[i], OBJECT_OUTLINE);

  ctx.strokeStyle = PLAYER_OUTLINE_COLOR;
  ctx.lineWidth = PLAYER_OUTLINE_WIDTH;
  ctx.fillStyle = PLAYER_COLOR;
  for(var i in players) {
    var p = players[i];
    drawObject(p, PLAYER_OUTLINE);

    var player_radius = Math.sqrt(Math.pow(p.vertices[0].x - players[i].x, 2) + Math.pow(p.vertices[0].y - players[i].y, 2));
    var hand_angle = 2 * Math.PI * p.hand / 256;
    var xCoord = p.x - cam.x + cvs.width / 2;
    var yCoord = p.y - cam.y + cvs.height / 2;

    ctx.drawImage(images.eyes, xCoord - player_radius, yCoord - player_radius, player_radius * 2, player_radius * 2); // Draw eyes

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
    var b = bullets[i];
    drawBullet(b);
  }

  // Healthbar
  ctx.drawImage(images.healthbar, cvs.width / 2 - images.healthbar.width / 2, 20);
}

function drawBullet(b) {
  let bullet_angle = 2 * Math.PI * b.angle / 256;
  let xCoord = b.vertices[0].x - cam.x + cvs.width / 2;
  let yCoord = b.vertices[0].y - cam.y + cvs.height / 2;

  ctx.save();
  ctx.translate(xCoord, yCoord);
  ctx.rotate(-bullet_angle);
  ctx.drawImage(images.bullet, 0, 0);
  ctx.restore();
}

function drawObject(p, outline) {
  ctx.beginPath();

  ctx.moveTo(p.vertices[0].x - cam.x + cvs.width / 2, p.vertices[0].y - cam.y + cvs.height / 2);
  for(var i = 1; i < p.vertices.length; i++)
    ctx.lineTo(p.vertices[i].x - cam.x + cvs.width / 2, p.vertices[i].y - cam.y + cvs.height / 2);
  ctx.lineTo(p.vertices[0].x - cam.x + cvs.width / 2, p.vertices[0].y - cam.y + cvs.height / 2);

  ctx.fill();

  if(outline) ctx.stroke();
}
