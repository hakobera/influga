var influx = require('influx');
var db = 'dummy_data';
var client = influx('localhost', 8086, 'root', 'root', db);
var seriesName = 'access_log';
var timer = null;
var _ = require('underscore');
var query = 'SELECT * FROM access_log WHERE time > now() - 5s';

function onExit() {
  console.log('exiting ...');
  clearInterval(timer);

  client.deleteDatabase(db, function (err) {
    if(err) return console.error(err);
    console.log('Delete ' + db);
    process.exit(0);
  });
}

client.createDatabase(db, function(err) {
  if(err && err.message !== 'database ' + db + ' exists') {
    throw err;
  }
  console.log('Create ' + db);

  timer = setInterval(function () {
    var points = [];
    points.push({
      method: _.sample(['GET', 'POST', 'PUT', 'DELETE', 'HEAD'], 1)[0],
      status: _.sample([200, 301, 400, 500], 1)[0],
      uri   : '/data/' + _.sample([1, 2, 3, 4], 1)[0],
      response_time: _.random(100, 2000)
    });

    console.log('Write points ...');
    client.writePoints(seriesName, points, function (err) {
      if (err) return console.error(err);

      client.query(query, function (err, data) {
        if (err) return console.error(err);
        data.forEach(function (d) {
          console.log(d.points);
        });
      });
    });

  }, 100);

  process.on('SIGINT', onExit);
  process.on('uncaughtException', onExit);
});
