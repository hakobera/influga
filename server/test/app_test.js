var request = require('supertest');
var influx = require('influx');
var async = require('async');
var fs = require('fs');

var app = require('../src/app');

var config = {
  "dashboardDbPath": "./test.db",
  "host": "localhost",
  "port": 8086,
  "database": "test",
  "username": "root",
  "password": "root",
  "useProxy": true
};

var server = app.create(config);
var client = influx(config.host, config.port, config.username, config.password, config.database);

describe('app', function () {
  beforeEach(function (done) {
    client.createDatabase(config.database, done);
  });

  afterEach(function (done) {
    client.deleteDatabase(config.database, done);
  });

  describe('GET /config.json', function () {
    it('should return influxdb config', function (done) {
      request(server)
        .get('/config.json')
        .expect('Content-Type', /json/)
        .expect(200, { database: 'test', useProxy: true })
        .end(done);
    });
  });

  describe('/shared/dashboards', function () {
    afterEach(function () {
      if (fs.existsSync(config.dashboardDbPath)) {
        fs.unlinkSync(config.dashboardDbPath);
      }
    });

    it('should return empty array if now dashboards', function (done) {
      request(server)
        .get('/shared/dashboards')
        .expect('Content-Type', /json/)
        .expect(200, [])
        .end(done);
    });

    it('should return dashboards', function (done) {
      var dashboard1 = require('../../app/assets/dashboards/default.json');
      var dashboard2 = require('../../app/assets/dashboards/test.json');

      async.series([
        function (next) {
          // Return emtpy array if no dashboards
          request(server)
            .get('/shared/dashboards')
            .expect('Content-Type', /json/)
            .expect(200, [])
            .end(next);
        },
        function (next) {
          request(server)
            .post('/shared/dashboards')
            .send(dashboard1)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function (res) {
              if (!('_id' in res.body)) return 'missing _id';
              if (res.body.type !== 'dashboard') return 'type must be dashboard';
              if (res.body.name !== dashboard1.name) return 'name is wrong';
            })
            .end(next);
        },
        function (next) {
          request(server)
            .get('/shared/dashboards')
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function (res) {
              var dashboards = res.body;
              if (dashboards.length !== 1) return 'dashboards.length expects 1 but ' + dashboards.length;
            })
            .end(next);
        },
        function (next) {
          request(server)
            .post('/shared/dashboards')
            .send(dashboard2)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function (res) {
              if (!('_id' in res.body)) return 'missing _id';
              if (res.body.type !== 'dashboard') return 'type must be dashboard';
              if (res.body.name !== dashboard2.name) return 'name is wrong';
            })
            .end(next);
        }
      ], function (err) {
        if (err) return done(err);
        request(server)
          .get('/shared/dashboards')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            var dashboards = res.body;
            if (dashboards.length !== 2) return 'dashboards.length expects 2 but ' + dashboards.length;
          })
          .end(done);
      });
    });
  });
});
