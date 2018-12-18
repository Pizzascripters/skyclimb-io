const fs = require('fs');

const Matter = require('./lib/matter');

const Vertices = Matter.Vertices,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      rectangle = Bodies.rectangle,
      circle = Bodies.circle,
      trapezoid = Bodies.trapezoid;

let map = [];
let objects = [];

const json = fs.readFileSync("./app/json/mapdata.json");
objects = JSON.parse(json);

for(var i in objects){
  let vertices = objects[i];
  vertices[vertices.length] = vertices[0];

  for(var i in vertices) {
    i = Number(i);

    // Get points A, B, C, and D
    var a = i === 0 ? vertices[vertices.length - 1] : vertices[i - 1];
    const b = vertices[i];
    const c = vertices[(i + 1) % vertices.length];
    const d = vertices[(i + 2) % vertices.length];

    // Calculate angles be and cf
    const bc = Math.atan2(c.y - b.y, c.x - b.x);
    const ba = Math.atan2(a.y - b.y, a.x - b.x);
    const cb = Math.atan2(b.y - c.y, b.x - c.x);
    const cd = Math.atan2(d.y - c.y, d.x - c.x);
    const be = (bc + ba) / 2;
    const cf = (cb + cd) / 2;

    // Create other side of trapezoid
    const e = {
      x: b.x + 50 * Math.cos(be),
      y: b.y + 50 * Math.sin(be)
    }
    const f = {
      x: c.x + 50 * Math.cos(cf),
      y: c.y + 50 * Math.sin(cf)
    }

    // Create body BCFE
    let v = [b, c, f, e];
    v = Vertices.clockwiseSort(v);
    body = Body.create({
      position: Vertices.centre(v),
      isStatic: true
    });
    Body.setVertices(body, v);
    map.push(body);
  }
}

module.exports = {
  bodies: map,
  objects: objects
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
    (Math.pow(distance(p1, p2), 2) +
     Math.pow(distance(p2, p3), 2) -
     Math.pow(distance(p1, p3), 2)) /
    (2 * distance(p1, p2) * distance(p2, p3))
  );
}

function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2)
  );
}
