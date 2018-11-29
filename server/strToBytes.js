module.exports = function strToBytes(str){
  let bytes = [];
  for(var i = 0; i < str.length; i++){
    const code = str.charCodeAt(i);
    bytes = bytes.concat([code]);
  }
  return bytes;
}
