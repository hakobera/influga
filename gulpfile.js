var gulp = require('gulp');
var jade = require('gulp-jade');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var stylus = require('gulp-stylus');
var nib = require('nib');
var browserify = require('browserify');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var gulpBowerFiles = require('gulp-bower-files');
var gulpFilter = require('gulp-filter');
var order = require("gulp-order");
var flatten = require('gulp-flatten');
var streamqueue = require('streamqueue');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');
var source = require('vinyl-source-stream');

var environment = 'development';
var paths = {
  src: './app/',
  dest: './public/',
  bower: './bower_components/',
  vendor: './vendor/'
};

gulp.task('set-production', function() {
  environment = 'production';
});

gulp.task('assets', function() {
  gulpBowerFiles()
    .pipe(plumber())
    .pipe(gulpFilter('**/fonts/*'))
    .pipe(flatten())
    .pipe(gulp.dest(paths.dest + 'fonts/'));

  gulp.src(paths.src + 'assets/**/*')
    .pipe(plumber())
    .pipe(gulp.dest(paths.dest));
});

gulp.task('vendor-styles', function() {
  var stream = gulpBowerFiles()
    .pipe(plumber())
    .pipe(gulpFilter('**/*.css'))
    .pipe(flatten())
    .pipe(order([
      'bootstrap.css',
      '*.css'
    ]))
    .pipe(concat("vendor.css"));

  if (environment == 'production') {
    stream.pipe(minifyCSS());
  }

  stream.pipe(gulp.dest(paths.dest + 'css/'));
});

gulp.task('vendor-scripts', function() {
  var stream = streamqueue({ objectMode: true },
      gulpBowerFiles(),
      gulp.src(paths.vendor + '**/*.js')
    )
    .pipe(plumber())
    .pipe(gulpFilter('**/*.js'))
    .pipe(flatten())
    .pipe(order([
      'jquery.js',
      'd3.js',
      'moment.js',
      '*.js'
    ]))
    .pipe(concat("vendor.js"));

  if (environment == 'production') {
    stream.pipe(uglify());
  }

  stream.pipe(gulp.dest(paths.dest + 'js/'));
});

gulp.task('scripts', function() {
  var stream = browserify({
      entries: [paths.src + 'scripts/initialize.js'],
      extensions: ['.jade']
    })
    .bundle({ debug: true })
    .pipe(plumber())
    .pipe(source('index.js'));

  if (environment == 'production') {
    stream.pipe(uglify());
  }

  stream.pipe(gulp.dest(paths.dest + 'js/'));
});

gulp.task('html', function() {
  gulp.src(paths.src + 'index.jade')
    .pipe(plumber())
    .pipe(jade({
      pretty: environment == 'development'
    }))
    .pipe(gulp.dest(paths.dest));
});

gulp.task('styles', function () {
  var stream = gulp.src(paths.src + 'styles/main.styl')
    .pipe(plumber())
    .pipe(stylus({ use: nib(), errors: true }));

  if (environment == 'production') {
    stream.pipe(minifyCSS());
  }

  stream.pipe(gulp.dest(paths.dest + 'css/'));
});

gulp.task('watch', function () {
  var server = livereload();

  gulp.watch(paths.src + 'scripts/**/*', ['lint', 'scripts']);
  gulp.watch(paths.src + 'styles/**/*.styl', ['styles']);
  gulp.watch(paths.src + 'assets/**/*', ['assets']);
  gulp.watch(paths.src + 'index.jade', ['html']);

  gulp.watch([
      paths.dest + 'js/*.js',
      paths.dest + 'css/*.css',
      paths.dest + '**/*.html'
    ], function(evt) {
      server.changed(evt.path);
    });

  nodemon({
    script: 'bin/influga.js',
    args: ['start', '--config', 'scripts/config.json'],
    watch: 'server',
    ext: 'js',
    env: { 'NODE_ENV': 'development' }
  })
  .on('change', ['lint-server'])
  .on('restart', function () {
    console.log('restarted!');
  });
});

gulp.task('lint', function () {
  gulp.src(paths.src + 'scripts/**/*.js')
    .pipe(plumber())
    .pipe(jshint());
});

gulp.task('lint-server', function () {
  gulp.src('./server/app.js')
    .pipe(plumber())
    .pipe(jshint());
});

gulp.task('vendor', ['vendor-styles', 'vendor-scripts']);
gulp.task('compile', ['html', 'styles', 'scripts']);

gulp.task('default', ['assets', 'vendor', 'compile']);
gulp.task('production', ['set-production', 'default']);
