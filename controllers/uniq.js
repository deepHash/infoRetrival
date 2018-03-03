function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }
  
  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if ((arr[i]['term'] === arr[j]['term']) && (arr[i]['docNumber'] === arr[j]['docNumber'])) {
        arr.splice(j--, 1);
        arr[i]['hits']++;
      }
    }
  }
  return arr;
};

module.exports = unique
