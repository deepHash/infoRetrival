"use strict"

function unique_pred(list, key, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0][key], b=list[0][key]
  for(var i=1; i<len; ++i) {
    b = a
    a = list[i][key]
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++][key] = a
    }
  }
  list.length = ptr
  return list
}

function unique_eq(list, key) {
  var ptr = 1
    , len = list.length
    , a=list[0][key], b = list[0][key]
  for(var i=1; i<len; ++i, b=a) {
    b = a
    a = list[i][key]
    //add and docnumber !=
    if(a !== b) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++][key] = a
    }
  }
  list.length = ptr
  return list
}

function unique(list, key, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare)
    }
    return unique_pred(list, key, compare)
  }
  if(!sorted) {
    list.sort()
  }
  return unique_eq(list, key)
}

module.exports = unique
