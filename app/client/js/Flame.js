function Flame(id) {
  this.particles = [];
  if(id === 1) {
    this.particleCount = 200;
  } else if(id === 2) {
    this.particleCount = 400;
  } else if(id === 3) {
    this.particleCount = 100;
  } else if(id === 4) {
    this.particleCount = 150;
  }

  while(this.particles.length < this.particleCount) {
    this.particles.push(new Particle(id));
  }

  this.update = () => {
    for(var i in this.particles) {
      this.particles[i].update();
    }
  }

  this.render = (ctx, x, y) => {
    for(var i in this.particles) {
      this.particles[i].render(ctx, x, y);
    }
  }
}
