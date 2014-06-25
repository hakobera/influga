var Chart = require('../../../lib/time-series-chart');
var utils = require('../../../lib/utils');

module.exports = Vue.extend({
  template: require('./template')(),
  timer: null,

  created: function () {
    this.$watch('refresh', this.timer.bind(this));
  },

  ready: function () {
    var dom = this.$el.querySelector('.chart');
    this.chart = Chart.create(dom, this.$data);
    this.tick();

    this.$on('update', function (dashboard) {
      this.tick();
    });

    this.$id = uuid.v1();
  },

  beforeDestroy: function () {
    this.stopTimer();
  },

  methods: {
    editPanel: function () {
      $('.collapse', this.$el).collapse('toggle');
    },

    deletePanel: function () {
      if (window.confirm(this.deleteConfirmationMessage)) {
        this.$dispatch('delete-panel', this);
      }
    },

    onError: function (xhr, textStatus, error) {
      if (typeof xhr.responseText === 'string' && xhr.responseText.match(/^Error:/)) {
        this.chart.error(xhr.responseText);
      } else {
        this.chart.error(xhr.status + ':' + xhr.statusText);
      }
    },

    timer: function (enable) {
      return enable ? this.startTimer() : this.stopTimer();
    },

    startTimer: function () {
      var self = this;
      this.stopTimer();
      this.$options.timer = setTimeout(function tf() {
        self.tick();
        if (self.refresh) {
          self.$options.timer = setTimeout(tf, utils.milisec(self.interval));
        }
      }, utils.milisec(this.interval));
      self.tick();
    },

    stopTimer: function () {
      if (this.$options.timer) {
        clearTimeout(this.$options.timer);
        this.$options.intervalTimer = null;
      }
    },

    tick: function () {
      var self = this;
      this.chart.prepareUpdate(this);
      if (_.isEmpty(this.query)) {
        Vue.nextTick(function () {
          self.chart.error('Query is empty');
        });
      } else {
        var refresh = $('.refresh', this.$el);
        refresh.addClass('rotate');

        influxdb
          .query(this.fullQuery)
          .done(function (data) {
            Vue.nextTick(function () {
              self.chart.update(data);
            });
          })
          .fail(this.onError.bind(this))
          .always(function () {
            refresh.removeClass('rotate');
          });
      }
    }
  },

  computed: {
    fullQuery: function () {
      var dashboard = this.$root.dashboard;
      var q = this.query.replace(/;\s*$/, '');
      if (q.toLowerCase().indexOf('where') === -1) {
        return q + ' WHERE time > ' + dashboard.from + ' AND time < ' + dashboard.to + ' ORDER ASC';
      } else {
        return q + ' AND time > ' + dashboard.from + ' AND time < ' + dashboard.to + ' ORDER ASC';
      }
    },

    deleteConfirmationMessage: function () {
      return 'Are you sure you want to remove this "' + this.title + '" panel?';
    }
  }
});
