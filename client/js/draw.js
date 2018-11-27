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

    // Draw hand
    var player_radius = Math.sqrt(Math.pow(p.vertices[0].x - players[i].x, 2) + Math.pow(p.vertices[0].y - players[i].y, 2));
    var hand_angle = 2 * Math.PI * p.hand / 256;
    var xCoord = p.x - cam.x + cvs.width / 2
    var yCoord = p.y - cam.y + cvs.height / 2

    ctx.beginPath();
    ctx.arc(
      xCoord + 0.3 * player_radius * Math.cos(hand_angle),
      yCoord - 0.3 * player_radius * Math.sin(hand_angle),
      player_radius / 5, 0, 2 * Math.PI
    );
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      xCoord + 1.3 * player_radius * Math.cos(hand_angle),
      yCoord - 1.3 * player_radius * Math.sin(hand_angle),
      player_radius / 5, 0, 2 * Math.PI
    );
    ctx.stroke();
    ctx.fill();
  }
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
