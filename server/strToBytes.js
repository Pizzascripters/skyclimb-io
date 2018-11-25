module.exports = function strToBytes(str){
  var bytes = [];
  for(var i = 0; i < str.length; i++){
    var code = str.charCodeAt(i);
    bytes = bytes.concat([code]);
  }
  return bytes;
}
