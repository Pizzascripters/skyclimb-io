// Check if point p is inside a rectangle
module.exports = (p, rect) => {
  if(
    p.x < rect.x ||
    p.x > rect.x + rect.width ||
    p.y < rect.y ||
    p.y > rect.y + rect.height
  ) {
    return false;
  } else {
    return true;
  }
}
