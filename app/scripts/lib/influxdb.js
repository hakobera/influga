function InfluxDB(opts) {
  opts = opts || {};
  this.host     = opts.host || 'localhost';
  this.hosts    = opts.hosts || [this.host];
  this.port     = opts.port || 8086;
  this.username = opts.username || 'root';
  this.password = opts.password || 'root';
  this.database = opts.database;
  this.isCrossOrigin = (this.hosts.indexOf(window.location.host) !== -1);
  this.useProxy = opts.useProxy || false;
}

InfluxDB.prototype.query = function (query) {
  return this.get(this.path("db/" + this.database + "/series", {q: query}));
};

InfluxDB.prototype.get = function (path) {
  return $.ajax({
    url: this.url(path),
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    crossDomain: this.isCrossOrigin
  });
};

InfluxDB.prototype.path = function (action, opts) {
  var path = action;
  if (this.useProxy) {
    if (opts && opts.q) {
      path += "?q=" + encodeURIComponent(opts.q);
    }
  } else {
    path += "?u=" + this.username + "&p=" + this.password;
    if (opts && opts.q) {
      path += "&q=" + encodeURIComponent(opts.q);
    }
  }
  return path;
};

InfluxDB.prototype.url = function (path) {
  if (this.useProxy) {
    return "/" + path;
  } else {
    var host = this.hosts.shift();
    this.hosts.push(host);
    return "//" + host + ":" + this.port + "/" + path;
  }
};

module.exports = InfluxDB;
