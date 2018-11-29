const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 5;

module.exports = function (Matter, p) {
  var bulletX = p.body.x;
  var bulletY = p.body.y;

  this.body = Matter.Bodies.rectangle(BULLET_WIDTH, BULLET_HEIGHT, 5, 5);
}
