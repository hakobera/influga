exports.milisec = function milisec(str) {
  var ret = str.match(/(\d+)([s|m|h|d])/);
  if (!ret || !ret[1]) {
    return 0;
  }

  var base = parseInt(ret[1], 10);
  if (ret[2] === 's') {
    return base * 1000;
  } else if (ret[2] === 'm') {
    return base * 1000 * 60;
  } else if (ret[2] === 'h') {
    return base * 1000 * 60 * 60;
  } else if (ret[2] === 'd') {
    return base * 1000 * 60 * 60 * 24;
  }
};

exports.toInfluxdbTime = function toInfluxdbTime(str) {
  var ret = Date.parse(str);
  if (ret) {
    return ret / 1000 + 's';
  } else {
    return str;
  }
};
