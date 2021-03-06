const fs = require('fs');

const Matter = require('./lib/matter');
const Shop = require('./constructors/Shop');
const distance = require('./util/distance');
const setConstants = require('./constants');

var constants = {};
setConstants(constants);

const Vertices = Matter.Vertices,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      rectangle = Bodies.rectangle,
      circle = Bodies.circle,
      trapezoid = Bodies.trapezoid;

let map = [];
let szBodies = [];

const json = JSON.parse(fs.readFileSync("./app/json/mapdata.json"));
let objects = json.objects;
let shops = json.shops;
let objectTypes = json.objectTypes;

for(var i in objects){
  if(objectTypes[i] === "solid") {
    let vertices = objects[i];

    /* Following is an algorithm for generating a layer of trapezoids based on the set of vertices loaded in JSON
     * The trapezoids are invisible to the player, but they serve as the physical collision boundaries for the map
     * Currently, this algorithm is awful, and I am open to suggestions */

    for(var i in vertices) {
      i = Number(i);

      // Get points A, B, C, and D
      const a = i === 0 ? vertices[vertices.length - 1] : vertices[i - 1];
      const b = vertices[i];
      const c = vertices[(i + 1) % vertices.length];
      const d = vertices[(i + 2) % vertices.length];

      // Calculate angles be and cf
      const bc = Math.atan2(c.y - b.y, c.x - b.x);
      const ba = Math.atan2(a.y - b.y, a.x - b.x);
      const cb = Math.atan2(b.y - c.y, b.x - c.x);
      const cd = Math.atan2(d.y - c.y, d.x - c.x);
      let be = midangle(bc, ba);
      let cf = midangle(cb, cd);

      // Create other side of trapezoid
      if(clockwise(a, b, c)) {
        var e = {
          x: b.x + constants.MOUNTAIN_THICKNESS * Math.cos(be),
          y: b.y + constants.MOUNTAIN_THICKNESS * Math.sin(be)
        }
      } else {
        var e = {
          x: b.x - constants.MOUNTAIN_THICKNESS * Math.cos(be),
          y: b.y - constants.MOUNTAIN_THICKNESS * Math.sin(be)
        }
      }
      if(clockwise(b, c, d)) {
        var f = {
          x: c.x + constants.MOUNTAIN_THICKNESS * Math.cos(cf),
          y: c.y + constants.MOUNTAIN_THICKNESS * Math.sin(cf)
        }
      } else {
        var f = {
          x: c.x - constants.MOUNTAIN_THICKNESS * Math.cos(cf),
          y: c.y - constants.MOUNTAIN_THICKNESS * Math.sin(cf)
        }
      }

      // Create body BCFE
      let v = [b, c, f, e];
      body = Body.create({
        position: Vertices.centre(v),
        isStatic: true
      });
      body.type = "mountain";
      body.collisionFilter.category = 3;
      body.collisionFilter.mask = 3;
      Body.setVertices(body, v);
      map.push(body);
    }
  } else if(objectTypes[i] === "safezone") {
    let v = [];
    objects[i].forEach(vertex => {
      v.push(vertex);
    });
    v = Vertices.clockwiseSort(v);
    body = Body.create({
      position: Vertices.centre(v),
      isStatic: true
    });
    body.type = "safezone";
    body.collisionFilter.category = 4;
    body.collisionFilter.mask = 4;
    Body.setVertices(body, v);
    map.push(body);
    szBodies[i] = body;
  }
}

for(var i in shops)
  shops[i] = Shop(shops[i].type, shops[i].x, shops[i].y)

module.exports = {
  bodies: map,
  objects,
  objectTypes,
  shops,
  szBodies
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

// Determines if a triplet of points is clockwise
function clockwise(a, b, c) {
  return (a.y - b.y) * (c.x - b.x) -
         (b.x - a.x) * (b.y - c.y) >= 0;
}

// Finds the bisector angle between two angles
function midangle(a, b) {
  var i = 1;
  while(Math.abs(a - b) > Math.PI) {
    if(i % 2 === 0) {
      a += Math.PI * 2 * i;
    } else {
      a -= Math.PI * 2 * i;
    }
    i++;
  }
  return (a + b) / 2;
}
