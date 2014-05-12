var dashboard = require('../../lib/dashboard');

module.exports = Vue.extend({
  template: require('./template')(),

  components: {
    header: require('../header'),
    line: require('../panel/line'),
    dateDialog: require('../date-dialog')
  },

  created: function () {
    this.$on('delete-panel', function (panel) {
      this.deleteRow(panel.$parent);
    });

    this.$on('show-date-dialog', function () {
      this.$.dateDialog.show(this.from, this.to);
    });

    this.$on('set-from-to-date', function (from, to) {
      this.from = from;
      this.to = to;
      this.$broadcast('update', this);
    });

    this.$on('add-panel', function () {
      var base = this._initialPanelData();
      this.panels.push(base);
    });
  },

  ready: function () {
    var self = this;
    $('.panels').sortable({
      update: function (e, ui) {
        self._updatePanels(this);
      }
    });
  },

  methods: {
    saveDashboard: function () {
      var data = _.clone(this.$data);
      dashboard
        .save(data)
        .done(function (data) {
          window.location.hash = '/dashboards/shared/' + data._id;
        })
        .fail(function () {
          alert('Failed to save dashaboard');
        });
    },

    deleteRow: function (panel) {
      this.panels.splice(panel.$index, 1);
    },

    _updatePanels: function (target) {
      var self = this;
      var map = {};
      var pos = [];
      var i = 0;

      $('.panel', $(target)).each(function () {
        var id = $(this).data('id');
        pos.push({
          index: i++,
          id: id
        });
      });

      _.each(this.$.panels, function (panel, i) {
        var id = panel.$.panel.$id;
        map[id] = self.panels[i];
      });

      while (self.panels.pop()) {}
      _.each(pos, function (p, i) {
        self.panels.push(map[p.id]);
      });
    },

    _initialPanelData: function () {
      return {
        "title": "Panel",
        "type": "raw",
        "query": "",
        "interval": "30s",
        "yAxisLabel": "",
        "refresh": false,
        "height": 200
      };
    }
  },

  computed: {
    fromTo: function () {
      if (this.from.substr(0,6) == 'now()-') {
        return this.from.substr(6) + ' ago to ' + moment().format('YYYY/MM/DD HH:MM:SS');
      } else {
        return this.from + ' to ' + this.to;
      }
    }
  }
});
