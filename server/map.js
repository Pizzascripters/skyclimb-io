module.exports = function(Matter){
  var Bodies = Matter.Bodies;
  var Body = Matter.Body;
  var rectangle = Bodies.rectangle;
  var circle = Bodies.circle;

  var map = [];
  map[0] = rectangle(1000, 900, 1000, 60);
  map[1] = rectangle(470, 450, 60, 600);
  map[2] = rectangle(1530, 450, 60, 600);
  map[3] = rectangle(1000, 700, 500, 60);
  map[4] = circle(500, 500, 100)

  for(var i in map) Body.setStatic(map[i], true);

  return map;
};
