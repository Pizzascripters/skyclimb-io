module.exports = function(Matter){
  var Vertices = Matter.Vertices,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      rectangle = Bodies.rectangle,
      circle = Bodies.circle,
      trapezoid = Bodies.trapezoid;

  var map = [];

  // Outside box
  map[0] = rectangle(0, 1000, 2100, 100);
  map[1] = rectangle(1000, 0, 100, 2100);
  map[2] = rectangle(-1000, 0, 100, 2100);
  map[3] = rectangle(0, -1000, 2100, 100);

  map[4] = trapezoid(0, 300, 1000, 200, 0.8);
  map[5] = trapezoid(0, 650, 555, 200, -0.8);
  map[6] = rectangle(-500, -125, 50, 800);
  map[7] = rectangle(-450, -50, 150, 50)
  map[8] = circle(-100, -225, 75);
  map[9] = rectangle(-600, -475, 200, 100)

  /*body = Body.create({"position": vector});
  Body.setVertices(body, array_of_vectors);*/

  for(var i in map) Body.setStatic(map[i], true);

  return map;
};
