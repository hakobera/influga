exports.all = function () {
  return $.ajax('/shared/dashboards', {
    type: 'get',
    dataType: 'json',
    timeout: 10000
  });
};

exports.save = function (data) {
  return $.ajax('/shared/dashboards', {
    type: 'post',
    data: JSON.stringify(data),
    contentType: 'application/json',
    dataType: 'json',
    timeout: 10000
  });
};

exports.load = function (id) {
  return $.ajax('/shared/dashboards/' + encodeURIComponent(id), {
    type: 'get',
    dataType: 'json',
    timeout: 10000
  });
};

exports.delete = function (id) {
  return $.ajax('/shared/dashboards/' + encodeURIComponent(id), {
    type: 'delete'
  });
};
