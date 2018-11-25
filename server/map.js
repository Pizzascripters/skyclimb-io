module.exports = function(Matter){
  var map = [];
  map[0] = Matter.Bodies.rectangle(1000, 900, 1000, 60, { isStatic: true });
  map[1] = Matter.Bodies.rectangle(470, 450, 60, 600, { isStatic: true });
  map[2] = Matter.Bodies.rectangle(1530, 450, 60, 600, { isStatic: true });
  map[3] = Matter.Bodies.rectangle(1000, 700, 500, 60, { isStatic: true });

  return map;
};
