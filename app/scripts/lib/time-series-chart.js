function Chart(svg, chart, opts) {
  this.svg = svg;
  this.chart = chart;
  this.opts = opts || {};
  this.setConverter(opts.type);
  this.svg.datum([]).call(this.chart);
  nv.utils.windowResize(this.chart.update);
}
module.exports = Chart;

Chart.prototype.update = function (data) {
  var series = this.converter(data);
  this.chart.noData('No Data Available');
  this.svg.datum(series).call(this.chart);
  return this;
};

Chart.prototype.prepareUpdate = function (opts) {
  if (opts.yAxisLabel) {
    this.chart.yAxis.axisLabel(opts.yAxisLabel).axisLabelDistance(50);
  } else {
    this.chart.yAxis.axisLabel('');
  }
  return this;
};

Chart.prototype.error = function (message) {
  this.chart.noData(message);
  this.svg.datum([]).call(this.chart);
  return this;
};

Chart.prototype.setConverter = function (type) {
  switch (type) {
  case 'raw':
    this.converter = rawNumberConverter;
    break;

  case 'aggregate':
    this.converter = aggregateConverter;
    break;

  default:
    throw new Error('Invalid type: ' + type);
  }
};

Chart.create = function (element, opts) {
  opts = opts || {};

  var d3chart = lineChart(opts);
  d3chart.xAxis
    .showMaxMin(false)
    .tickFormat(function (d) {
      return d3.time.format('%X')(new Date(d));
    });

  d3chart.yAxis.showMaxMin(false);
  d3chart.yAxis.tickFormat(formatKMBT);

  if (opts.yAxisLabel) {
    d3chart.yAxis.axisLabel(opts.yAxisLabel).axisLabelDistance(50);
  }

  var chart = new Chart(d3.select(element).append('svg'), d3chart, opts);
  return chart;
};

function lineChart(opts) {
  return nv.models
           .lineChart()
           .margin({left: 50, right: 20})
           .useInteractiveGuideline(true)
           .transitionDuration(200)
           .showLegend(true)
           .showYAxis(true)
           .forceY([0])
           .showXAxis(true);
}

function noData() {
  return [];
}

function rawNumberConverter(data) {
  if (!data || !data[0] || !data[0].columns) {
    return noData();
  }

  var columns = data[0].columns;
  var points = data[0].points;
  var series = [];
  var c2i = _.reduce(columns, function (memo, column, index) { memo[column] = index; return memo; }, {});

  _.each(columns, function (column, index, list) {
    if (_.include(['time', 'sequence_number'], column)) {
      return;
    }

    series.push({
      values: points.map(function (pt) { return { x: pt[0], y: pt[c2i[column]] }; }),
      key: column
    });
  });

  return series;
}

function aggregateConverter(data) {
  if (!data || !data[0] || !data[0].columns) {
    return noData();
  }

  var columns = data[0].columns;
  var points = data[0].points;
  var series = [];
  var c2i = _.reduce(columns, function (memo, column, index) { memo[column] = index; return memo; }, {});

  var prevTime = -1;
  var items = {};
  _.each(points, function (pt) {
    var time  = pt[0];
    var key   = pt[2];

    if (!items[key]) {
      items[key] = {
        values: [],
        key: key
      };
      series.push(items[key]);
    }

    items[key].values.push({ x: time, y: pt[1] });
  });

  return series;
}

function formatKMBT(y) {
  var abs_y = Math.abs(y);
  if (abs_y >= 1000000000000)   { return y / 1000000000000 + "T"; }
  else if (abs_y >= 1000000000) { return y / 1000000000 + "B"; }
  else if (abs_y >= 1000000)    { return y / 1000000 + "M"; }
  else if (abs_y >= 1000)       { return y / 1000 + "K"; }
  else if (abs_y < 1 && y > 0)  { return y.toFixed(2); }
  else if (abs_y === 0)         { return ''; }
  else                          { return y; }
}

function formatBase1024KMGTP(y) {
  var abs_y = Math.abs(y);
  if (abs_y >= 1125899906842624)  { return y / 1125899906842624 + "P"; }
  else if (abs_y >= 1099511627776){ return y / 1099511627776 + "T"; }
  else if (abs_y >= 1073741824)   { return y / 1073741824 + "G"; }
  else if (abs_y >= 1048576)      { return y / 1048576 + "M"; }
  else if (abs_y >= 1024)         { return y / 1024 + "K"; }
  else if (abs_y < 1 && y > 0)    { return y.toFixed(2); }
  else if (abs_y === 0)           { return ''; }
  else                            { return y; }
}
