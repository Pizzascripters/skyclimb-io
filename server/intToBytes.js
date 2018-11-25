// Converts an integer n to a string bytes (unsigned ints)

module.exports = function(n){
  n += 2147483648;

  var bytes = new Uint8Array(4);
  bytes[0] = Math.floor(n / 16777216);
  bytes[1] = Math.floor(n / 65536);
  bytes[2] = Math.floor(n / 256);
  bytes[3] = Math.floor(n % 256);
  return new Uint8Array(bytes);
}
