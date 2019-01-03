function createSnow(images) {
  var snow = [];
  for(var i = 0; i < SNOW_PARTICLES; i++) {
    snow.push(new Snow(images));
  }
  return snow;
}

function Snow(images) {
  this.x = Math.random() * cvs.width;
  this.y = Math.random() * cvs.height;
  this.xv = 0.05 * (Math.random() - 0.5);
  this.yv = 0.05 * (Math.random() - 0.5);
  this.width = Math.random() * 10 + 5;
  this.height = this.width;
  this.img = images[Math.floor(Math.random() * 3)];

  this.render = (ctx) => {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  this.update = (delta) => {
    // Delta = millis since last frame
    this.x += this.xv * delta;
    this.y += this.yv * delta;

    // Bounds
    const margin = 20;
    if(this.x < -margin) this.x += cvs.width + margin*2;
    if(this.x > cvs.width + margin) this.x -= cvs.width + margin*2;
    if(this.y < -margin) this.y += cvs.height + margin*2;
    if(this.y > cvs.height + margin) this.y -= cvs.height + margin*2;

    // Gravity & terminal velocity
    this.yv += 0.0002 * delta;
    if(this.yv > 0.02) this.yv = 0.1;

  }
}
