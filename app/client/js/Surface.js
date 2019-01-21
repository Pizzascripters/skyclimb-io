function createSurfaces(vertices) {
  for(var i in vertices) {
    if(vertices[i-1]) {
      var v0 = vertices[i-1];
    } else {
      var v0 = vertices[vertices.length - 1];
    }
    var v1 = vertices[i];
    var angle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
    if(angle < Math.PI/3 && angle > -Math.PI/3) {
      switch(getBiome(v1)) {
        case "sunset":
          vertices[i].surface = createGrassSurface(distance(v0, v1));
          break;
        case "snowy":
          vertices[i].surface = createSnowSurface(distance(v0, v1));
          break;
        case "starry":
          vertices[i].surface = createGrassSurface(distance(v0, v1));
          vertices[i].surface.type = "midnight";
          break;
      }
    } else if(angle > 2*Math.PI/3 || angle < -2*Math.PI/3) {
      switch(getBiome(v1)) {
        case "snowy":
          vertices[i].surface = createIceSurface(distance(v0, v1));
          break;
      }
    }
  }
}

// Creates an array of points for drawing the grass
function createGrassSurface(distance) {
  var pos = 20;

  // Dark grass
  var dark = [{x:0, y:0}];
  var i = 1;
  while(pos < distance - 20) {
    var dx = Math.random() * 30 + 10;
    if(i % 2 === 0) {
      var y = Math.random() * 10 + 10;
    } else {
      var y = Math.random() * 10 + 30;
    }
    dark[i] = {x:dark[i-1].x+dx, y};
    pos += dx;
    i++;
  }
  dark[i] = {x:distance, y:0};

  // Light grass
  var light = [];
  dark.forEach(vertex => {
    light.push({
      x: vertex.x,
      y: vertex.y * 0.8
    });
  });

  return {type:"grass", dark, light};
}

// Creates an array of points for drawing the snow
function createSnowSurface(distance) {
  // Dark snow
  var dark = [];
  var pos = 0;
  while(true) {
    radius = Math.random() * 30 + 20;
    pos += radius;
    if(pos + radius > distance) break;
    dark.push({pos, radius});
  }
  radius = Math.random() * 30 + 20;
  dark.push({pos: distance - radius, radius})

  // Light snow
  var light = [];
  dark.forEach(circle => {
    light.push({
      pos: circle.pos,
      radius: circle.radius * 0.75
    });
  });

  return {type:"snow", dark, light};
}

function createIceSurface(distance) {
  return {type:"ice"};
}
