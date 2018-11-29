module.exports = function bytesToStr(bytes){
  var str = "";
  for(var i = 0; i < bytes.length; i++){
    if(bytes[i] !== 0)
      str += String.fromCharCode(bytes[i]);
  }
  return str;
}
