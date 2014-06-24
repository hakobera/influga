var express = require('express');
var bodyParser = require('body-parser');
var morgan  = require('morgan');
var compress = require('compression');
var errorhandler = require('errorhandler');
var InfluxDB = require('./lib/influxdb');
var Dashboard = require('./lib/dashboard');

exports.create = function create(opts) {
  var app = express();
  var dashboard = new Dashboard({
    path: opts.dashboardDbPath
  });

  if (process.env.NODE_ENV === 'development') {
    app.use(require('connect-livereload')({port: 35729}));
    app.use(morgan());
  }

  var influxdb = new InfluxDB(opts);

  app.use(bodyParser.json());
  app.use(compress());
  app.use(express.static(__dirname + '/../../public'));
  app.use(errorhandler());

  app.route('/config.json')
    .get(function (req, res, next) {
      res.json(influxdb.config());
    });

  app.route('/db/:db/series')
    .get(function (req, res, next) {
      var query = req.query.q;
      influxdb.query(query, function (err, data) {
        if (err) {
          res.type('text/plain');
          return res.send(500, err.toString());
        }
        res.json(data);
      });
    });

  app.route('/shared/dashboards')
    .get(function (req, res, next) {
      dashboard.all(function (err, docs) {
        if (err) return res.json(400, err);
        res.json(docs);
      });
    })
    .post(function (req, res, next) {
      dashboard.save(req.body, function (err, doc) {
        if (err) return res.json(400, err);
        res.json(doc);
      });
    });

  app.route('/shared/dashboards/:id')
    .get(function (req, res, next) {
      dashboard.find({ _id: req.params.id }, function (err, doc) {
        if (err) return res.json(500, {});
        if (!doc) return res.json(404, {});
        res.json(doc);
      });
    })
    .delete(function (req, res, next) {
      dashboard.remove({ _id: req.params.id }, function (err, numRemoved) {
        if (err) return res.json(500, {});
        if (numRemoved !== 1) return res.json(404, {});
        res.json({});
      });
    });

  return app;
};
