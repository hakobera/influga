module.exports = Vue.extend({
  template: require('./template')(),

  created: function () {
    this.fromDateTime = null;
    this.toDateTime = null;
  },

  ready: function () {
    this._initDataTimePicker();
    this.$options.modal = $('.modal', this.$el);
  },

  dateFormat: 'YYYY/MM/DD HH:MM:SS',

  methods: {
    show: function (from, to) {
      this.$options.modal.modal('show');
      if (moment(from).isValid()) {
        _fromDateTime().setDate(moment(from));
      }
      if (moment(to).isValid()) {
        _toDateTime().setDate(moment(to));
      }
    },

    close: function () {
      this.$options.modal.modal('hide');
    },

    change: function () {
      var from = this._fromDateTime().getDate();
      var to = this._toDateTime().getDate();

      if (from.isValid() && to.isValid()) {
        this.$dispatch('set-from-to-date', from.format(this.$options.dateFormat), to.format(this.$options.dateFormat));
      }
      this.$options.modal.modal('hide');
    },

    _initDataTimePicker: function () {
      var fromDate = this.$options.fromDate = $('.from-date', this.$el);
      var toDate = this.$options.toDate = $('.to-date', this.$el);
      fromDate.datetimepicker({ pick12HourFormat: false });
      toDate.datetimepicker({ pick12HourFormat: false });
    },

    _fromDateTime: function () {
      return this.$options.fromDate.data('DateTimePicker');
    },

    _toDateTime: function () {
      return this.$options.toDate.data('DateTimePicker');
    }
  }
});
