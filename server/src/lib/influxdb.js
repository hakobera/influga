var influx = require('influx');
var _ = require('underscore');

function InfluxDB(opts) {
  var o = this.opts = {
    host: opts.host || 'localhost',
    port: opts.port || 8086,
    username: opts.username || 'root',
    password: opts.password || 'root',
    useProxy: opts.useProxy || false,
    database: opts.database
  };

  if (o.useProxy) {
    this.client = influx(o.host, o.port, o.username, o.password, o.database);
  }
}

InfluxDB.prototype.config = function () {
  var o = this.opts;
  var conf = {
    database: o.database,
    useProxy: o.useProxy
  };
  if (!o.useProxy) {
    conf = _.extend(conf, {
      host: o.host,
      port: o.port,
      username: o.username,
      password: o.password
    });
  }
  return conf;
};

InfluxDB.prototype.query = function (query, cb) {
  if (!this.opts.useProxy) {
    return cb(new Error('Proxy access is not allowed'));
  }
  this.client.query(query, cb);
};

module.exports = InfluxDB;

