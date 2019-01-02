function Flame() {
  this.particles = [];
  this.particleCount = 200;

  while(this.particles.length < this.particleCount) {
    this.particles.push(new Particle());
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
