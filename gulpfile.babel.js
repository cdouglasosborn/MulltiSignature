// generated on 2016-01-18 using generator-chrome-extension 0.5.1
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import runSequence from 'run-sequence';
import {stream as wiredep} from 'wiredep';
import sass from 'gulp-sass';
import concat from 'gulp-concat-util';
import replace from 'gulp-replace';
import browserify from 'gulp-browserify';

const $ = gulpLoadPlugins();


gulp.task('compilecontent', function() {
  gulp.src([
    'app/scripts/autocharlie/**/*.js',
    'app/scripts/shared/**/*.js',
    'app/scripts/content/*/*.js',
    'app/scripts/content/*/**/*.js',
    'app/scripts/content/main.js'
    ])
      .pipe(concat('contentscript.js'))
      .pipe(replace(/'use strict';/g, ''))
      .pipe(concat.header('\'use strict\';\n'))
      .pipe(gulp.dest('app/scripts'));
});

gulp.task('compilebackground', function() {
  gulp.src([
    'app/scripts/autocharlie/**/*.js',
    'app/scripts/shared/**/*.js',
    'app/scripts/background/*/*.js',
    'app/scripts/background/*/**/*.js',
    'app/scripts/background/main.js'
    ])
      .pipe(concat('background.js'))
      .pipe(replace(/'use strict';/g, ''))
      .pipe(concat.header('\'use strict\';\n'))
      .pipe(gulp.dest('app/scripts'));
});

gulp.task('compileoptions', function() {
  gulp.src([
    'app/scripts/autocharlie/**/*.js',
    'app/scripts/shared/**/*.js',
    'app/scripts/options/*/*.js',
    'app/scripts/options/*/**/*.js',
    'app/scripts/options/main.js'
    ])
      .pipe(concat('options.js'))
      .pipe(replace(/'use strict';/g, ''))
      .pipe(concat.header('\'use strict\';\n'))
      .pipe(gulp.dest('app/scripts'));
});


gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    'app/_locales/**',
    '!app/*.json',
    '!app/*.html',
  ], {
    base: 'app',
    dot: true
  }).pipe(gulp.dest('dist'));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe($.eslint(options))
      .pipe($.eslint.format());
  };
}

gulp.task('lint', lint('app/scripts/**/*.js', {
  env: {
    es6: false
  },
  globals: {
    'autocharlie': true,
    'multisig': true
  }
}));

gulp.task('sass', function () {
  gulp.src('./app/styles/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./app/styles'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('html',  () => {
  const assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.sourcemaps.init())
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe($.sourcemaps.write())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('chromeManifest', () => {
  return gulp.src('app/manifest.json')
    .pipe($.chromeManifest({
      buildnumber: true,
      background: {
        target: 'scripts/background.js',
        exclude: [
          'scripts/chromereload.js'
        ]
      }
  }))
  .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
  .pipe($.if('*.js', $.sourcemaps.init()))
  .pipe($.if('*.js', $.uglify()))
  .pipe($.if('*.js', $.sourcemaps.write('.')))
  .pipe(gulp.dest('dist'));
});


gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('watch', ['compilecontent', 'lint', 'html'], () => {
  $.livereload.listen();

  gulp.watch('app/scripts/content/**/*.js', ['compilecontent']);
  gulp.watch('app/scripts/background/**/*.js', ['compilebackground']);
  gulp.watch('app/scripts/options/**/*.js', ['compileoptions']);
  gulp.watch([
    'app/scripts/shared/**/*.js',
    'app/scripts/autocharlie/**/*.js'
  ], ['compilecontent']);

  gulp.watch([
    'app/*.html',
    'app/scripts/*.js',
    'app/images/**/*',
    'app/styles/**/*.css',
    'app/_locales/**/*.json'
  ]).on('change', $.livereload.reload);
  gulp.watch('app/styles/**/*.scss', ['lint', 'sass']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('size', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('wiredep', () => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('package', function () {
  var manifest = require('./dist/manifest.json');
  return gulp.src('dist/*')
      .pipe($.zip('MultiSignature-' + manifest.version + '.zip'))
      .pipe(gulp.dest('package'));
});

gulp.task('build', (cb) => {
  runSequence(
    'compilecontent', 'compilebackground', 'compileoptions',
    'lint', 'sass','chromeManifest',
    ['html', 'images', 'extras'],
    'size', cb);
});

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb);
});
