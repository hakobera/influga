var dashboard = require('../../lib/dashboard');

module.exports = Vue.extend({
  template: require('./template')(),

  created: function () {
    this.dashboards = [];
  },

  ready: function () {
    var self = this;
    $('.dashboard-dropdown', this.$el).on('show.bs.dropdown', this.loadDashboards.bind(this));
  },

  methods: {
    loadDashboards: function () {
      var self = this;
      dashboard.all().done(function (data) {
        self.dashboards = data;
      });
    },

    setFromToDate: function (from, to) {
      this.$dispatch('set-from-to-date', from, to);
    },

    showDateDialog: function () {
      this.$dispatch('show-date-dialog');
    },

    addPanel: function () {
      this.$dispatch('add-panel');
    },

    deleteDashboard: function (data) {
      var self = this;
      var msg = 'Are you sure you want to remove "' + data.name + '" dashboard?';
      if (confirm(msg)) {
        dashboard.delete(data._id).done(function () {
          alert('delete!');
        });
      }
    }
  }
});
