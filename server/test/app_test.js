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

process.env.NODE_ENV = 'development';

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

  describe('GET /db/:db/series', function () {
    describe('when valid query', function () {
      it('should return 200', function (done) {
        var query = 'SELECT 1 FROM /.*/ LIMIT 1';

        request(server)
          .get('/db/' + config.database + '/series')
          .query({ q: query })
          .expect('Content-Type', /json/)
          .expect(200, [])
          .end(done);
      });
    });

    describe('when invalid query', function () {
      it('should return 500 with error reason', function (done) {
        var query = 'a';

        request(server)
          .get('/db/' + config.database + '/series')
          .query({ q: query })
          .expect('Content-Type', /text\/plain/)
          .expect(500, 'Error: syntax error, unexpected SIMPLE_NAME\na\n^')
          .end(done);
      });
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
            .type('json')
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
            .type('json')
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

  describe('/shared/dashboards/:id', function () {
    afterEach(function () {
      if (fs.existsSync(config.dashboardDbPath)) {
        fs.unlinkSync(config.dashboardDbPath);
      }
    });

    describe('GET', function () {
      it('should return 404 if :id is not exists', function (done) {
        request(server)
          .get('/shared/dashboards/invalid')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(done);
      });

      it('should return saved dashboards', function (done) {
        var dashboard = require('../../app/assets/dashboards/default.json');

        async.waterfall([
          function (next) {
            request(server)
              .post('/shared/dashboards')
              .type('json')
              .send(dashboard)
              .end(function (err, res) {
                if (err) return next(err);
                next(null, res.body);
              });
          },
          function (body, next) {
            request(server)
              .get('/shared/dashboards/' + body._id)
              .expect('Content-Type', /json/)
              .expect(200, body)
              .end(function (err, res) {
                if (err) return next(err);
                next(null);
              });
          }
        ], function (err) {
          if (err) return done(err);
          done();
        });
      });
    });

    describe('DELETE', function () {
      it('should delete dashboard', function (done) {
        var dashboard = require('../../app/assets/dashboards/default.json');

        async.waterfall([
          function (next) {
            request(server)
              .post('/shared/dashboards')
              .type('json')
              .send(dashboard)
              .end(function (err, res) {
                if (err) return next(err);
                next(null, res.body);
              });
          },
          function (body, next) {
            request(server)
              .get('/shared/dashboards/' + body._id)
              .expect('Content-Type', /json/)
              .expect(200, body)
              .end(function (err, res) {
                if (err) return next(err);
                next(null, body);
              });
          },
          function (body, next) {
            request(server)
              .delete('/shared/dashboards/' + body._id)
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (err, res) {
                if (err) return next(err);
                next(null, body);
              });
          },
          function (body, next) {
            request(server)
              .get('/shared/dashboards/' + body._id)
              .expect('Content-Type', /json/)
              .expect(404)
              .end(next);
          }
        ], function (err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });
});
