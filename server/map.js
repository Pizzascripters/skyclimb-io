module.exports = function(Matter){
  var Vertices = Matter.Vertices,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      rectangle = Bodies.rectangle,
      circle = Bodies.circle,
      trapezoid = Bodies.trapezoid;

  var map = [];

  // Outside box
  map[0] = rectangle(0, 1000, 1880, 100);
  map[1] = rectangle(1000, 0, 100, 1880);
  map[2] = rectangle(-1000, 0, 100, 1880);
  map[3] = rectangle(0, -1000, 1880, 100);

  map[4] = rectangle(1000, 1000, 100, 100);
  map[5] = rectangle(1000, -1000, 100, 100);
  map[6] = rectangle(-1000, 1000, 100, 100);
  map[7] = rectangle(-1000, -1000, 100, 100);

  map[8] = trapezoid(0, 300, 1000, 200, 0.8);
  map[9] = trapezoid(0, 650, 555, 200, -0.8);
  map[10] = rectangle(-500, -125, 50, 800);
  map[11] = rectangle(-410, -50, 100, 50)
  map[12] = circle(-100, -225, 75);
  map[13] = rectangle(-625, -475, 175, 100)

  /*body = Body.create({"position": vector});
  Body.setVertices(body, array_of_vectors);*/

  for(var i in map)
    Body.setStatic(map[i], true);

  return map;
};
