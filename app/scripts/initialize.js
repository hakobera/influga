$(function() {
  FastClick.attach(document.body);

  var InfluxDB = require('./lib/influxdb');

  var router = new Grapnel();
  router.get('', loadDefaultDashboard);
  router.get('/dashboards/files/:name', loadFileDashboard);
  router.get('/dashboards/shared/:id', loadSharedDashboard);

  function loadDefaultDashboard(req) {
    loadDashboard('/dashboards/default.json');
  }

  function loadFileDashboard(req) {
    var name = req.params.name || 'default';
    loadDashboard('/dashboards/' + encodeURIComponent(name) + '.json');
  }

  function loadSharedDashboard(req) {
    var id = req.params.id;
    loadDashboard('/shared/dashboards/' + encodeURIComponent(id));
  }

  function loadDashboard(path) {
    console.log('Load dashboard from ' + path);
    if (!window._app) {
      $.when(
        $.get('/config.json'),
        $.get(path)
      ).done(function (config, dashboard) {
        window.influxdb = new InfluxDB(config[0]);
        window._app = new Vue({
          el: '#app',
          data: {
            dashboard: dashboard[0]
          },
          components: {
            dashboard: require('./components/dashboard')
          },
          created: function () {
            this.$watch('dashboard', function (newDashboard) {
              $('title').text(newDashboard.name + ' | Influga');
            });
          }
        });
      }).fail(function () {
        alert('Failed to load dashboard');
      });
    } else {
      $.get(path).done(function(dashboard) {
        window._app.dashboard = dashboard;
      });
    }
  }
});
