// Adds decoration to the map
function genDecoration(images, map) {
  map.decoration = [];
  map.objects.forEach(obj => {
    for(var i in obj.vertices) {
      const v0 = obj.vertices[i];
      const v1 = obj.vertices[i === String(obj.vertices.length-1) ? 0 : Number(i)+1];
      const angle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
      if(!v1.surface) continue;
      if(v1.surface.type === "grass" || v1.surface.type === "midnight") {
        for(var px = 0; px < distance(v0, v1) - 50; px++) {
          if(Math.random() < 0.02) {
            map.decoration.push(new Decoration(images.decoration, Math.floor(Math.random() * 5), [v0, v1], px));
          }
        }
      }
    }
    obj.vertices.forEach(vertex => {
      map.decoration.push();
    });
  });
}

function Decoration(images, type, edge, px) {
  this.type = type;
  switch(type) {
    case 0:
    case "flower1":
      this.img = images.flowers[0];
      break;
    case 1:
    case "flower2":
      this.img = images.flowers[1];
      break;
    case 2:
    case "flower3":
      this.img = images.flowers[2];
      break;
    case 3:
    case "grass1":
      this.img = images.grass[0];
      break;
    case 4:
    case "grass2":
      this.img = images.grass[1];
      break;
    default:
      this.img = null;
      break;
  }

  this.edge = edge;
  this.px = px;
  this.angle = Math.atan2(edge[1].y - edge[0].y, edge[1].x - edge[0].x);
  this.x = edge[0].x + px * Math.cos(this.angle);
  this.y = edge[0].y + px * Math.sin(this.angle);
}
