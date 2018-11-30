const Matter = require('./matter');

const Vertices = Matter.Vertices,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      rectangle = Bodies.rectangle,
      circle = Bodies.circle,
      trapezoid = Bodies.trapezoid;

module.exports = () => {

  let map = [];
  let vertices = [];

  vertices.push( {x:-200, y:300} );
  vertices.push( {x:100, y:300} );
  vertices.push( {x:200, y:360} );
  vertices.push( {x:300, y:340} );

  let n = 0;
  while(n < vertices.length - 1) {
    if(n === vertices.length - 2 || findAngle(vertices, n+1) >= Math.PI / 2) {
      const m = {
        x: (vertices[n+1].x + vertices[n].x) / 2,
        y: (vertices[n+1].y + vertices[n].y) / 2
      };
      const p = {
        x: 2 * m.y - vertices[n+1].y,
        y: 2 * m.x - vertices[n+1].x
      };
      createTriangle(map, vertices[n], vertices[n+1], p);
      n++;
    } else {
      createTriangle(map, vertices[n], vertices[n+1], vertices[n+2]);
      n += 2;
    }
  }

  return map;
};

function createTriangle(map, p1, p2, p3) {
  const sortedVertices = Vertices.clockwiseSort([p1, p2, p3]);
  body = Body.create({
    position: Vertices.centre(sortedVertices),
    isStatic: true
  });
  Body.setVertices(body, sortedVertices);
  map.push(body);
}

function findAngle(vertices, i) {
  const p1 = vertices[i-1];
  const p2 = vertices[i];
  const p3 = vertices[i+1];

  return Math.acos(
    Math.pow(distance(p1, p2), 2) +
    Math.pow(distance(p1, p3), 2) +
    Math.pow(distance(p2, p3), 2) /
    (2 * distance(p1, p2) * distance(p1, p3))
  );
}

function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.x - p1.x, 2)
  );
}
