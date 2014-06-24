#!/usr/bin/env node

var pkg = require('../package');
var program = require('commander');
var app = require('../server/src/app');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var COMMANDS = ['init', 'start'];

program
  .version(pkg.version)
  .usage('[options] {' + COMMANDS.join('|') + '}')
  .option('-p, --port <port>', 'Influga port', 8089)
  .option('-c, --config <config-file>', 'Influga config file path')
  .parse(process.argv);

if (!_.isEmpty(program.args) && _.contains(COMMANDS, program.args[0])) {
  var cmd = program.args[0];
  switch (cmd) {
  case 'start':
    start();
    break;

  case 'init':
    init();
    break;
  }
} else {
  console.error('Invalid command');
  program.help();
}

function start() {
  var configPath = program.config;
  if (!configPath) {
    console.error('config file is required');
    return program.help();
  }

  if (!fs.existsSync(configPath)) {
    console.error('%s is not exists', configPath);
    return process.exit(1);
  }

  var configJson = fs.readFileSync(configPath);
  var config;
  try {
    config = JSON.parse(configJson);
  } catch (e) {
    console.error('Config format error: %s', e.message);
    return process.exit(1);
  }

  config = _.extend({
    host: 'localhost',
    port: '8086',
    username: 'root',
    password: 'root',
    useProxy: true
  }, config);

  app.create(config).listen(program.port, function() {
    console.log('Listening on port %d', program.port);
  });
}

function init() {
  var tmpl = {
    dashboardDbPath: './db/influga.db',
    host: 'localhost',
    port: 8086,
    database: 'db',
    username: 'root',
    password: 'root'
  };
  var filename = 'influga-config.json';
  var config = JSON.stringify(tmpl, null, 2);
  fs.writeFileSync(filename, config);
  console.log('Config file template is created to influga-config.json');
  console.log('Edit config for your environment');
  console.log('');
  console.log(config);
}
