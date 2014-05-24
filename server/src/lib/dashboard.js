var Datastore = require('nedb');
var _ = require('underscore');
var path = require('path');
var mkdirp = require('mkdirp');

function Dashboard(opts) {
  var dbPath = opts.path;
  var dir = path.dirname(dbPath);
  mkdirp.sync(dir);

  var db = new Datastore({ filename: dbPath, autoload: true });
  db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {
    if (err) return console.error(err);
  });
  this.db = db;
}

Dashboard.prototype.all = function (cb) {
  this.db.find({ type: 'dashboard' }).sort({ name: 1 }).exec(cb);
};

Dashboard.prototype.find = function (condition, cb) {
  this.db.findOne(condition, cb);
};

Dashboard.prototype.save = function (data, cb) {
  var name = data.name;
  var doc = cleanup(_.extend({ type: 'dashboard' }, data));
  var self = this;

  this.db.update({ name: name }, cleanup(doc), { upsert: true }, function (err, numReplaced, upsert) {
    if (err) return cb(err);
    if (upsert) {
      cb(null, upsert);
    } else {
      self.db.findOne({ name: name }, function (err, doc) {
        if (err) return cb(err);
        cb(null, doc);
      });
    }
  });
};

Dashboard.prototype.remove = function (condition, cb) {
  this.db.remove(condition, cb);
};

function cleanup(data) {
  delete data._id;
  delete data.dashboards;
  if (data.panels) {
    var panels = [];
    data.panels.forEach(function (panel) {
      Object.keys(panel).forEach(function (key) {
        if (key[0] === '$') {
          delete panel[key];
        }
      });
    });
  }
  return data;
}

module.exports = Dashboard;
