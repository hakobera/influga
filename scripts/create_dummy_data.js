var influx = require('influx');
var db = 'dummy_data';
var client = influx('localhost', 8086, 'root', 'root', db);
var seriesName = 'metrics';
var timer = null;
var _ = require('underscore');
var query = 'SELECT * FROM metrics WHERE time > now() - 5s';

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
      usr: _.random(1, 20),
      sys: _.random(20, 40),
      idl: _.random(40, 60),
      wai: _.random(60, 80)
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

  }, 1000);

  process.on('SIGINT', onExit);
  process.on('uncaughtException', onExit);
});
