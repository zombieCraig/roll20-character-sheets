const pug = require('gulp-pug');
const data = require('gulp-data');
const stylus = require('gulp-stylus');
const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const merge = require('gulp-merge-json');
const showdown = require('showdown');
const through2 = require('through2');
const { ferunners } = require('dataforged')
//const { buildAssetTranslations, buildOracleTranslations } = require('./buildTranslations')

axios.defaults.baseURL = 'https://raw.githubusercontent.com/zombieCraig/datasworn/fe_runners/datasworn/fe_runners/';


gulp.task('dataforge', async function() {
  const apiData = {
    core: await axios.get("fe_runners.json"),
  }

  const rawData = {
    core: apiData.core.data,
  };

  // TODO: This needs to be redone to pull from the datasworn.json and check to see if there is a defined translation for a string
  //       When not found, then export some defaults to use.
  const translationData = {
    // 'translation-assets': buildAssetTranslations(),
    // 'translation-oracles': buildOracleTranslations()
  };

  for (let key in rawData) {
    const data = rawData[key];
    const fileName = path.join(__dirname, `./app/data/${key}.json`);
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  }

  for (let key in translationData) {
    const data = translationData[key]
    const fileName = path.join(__dirname, `./app/translations/${key}.json`);
    console.log(fileName);
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  }
});

gulp.task('convert-markdown', function() {
  const converter = new showdown.Converter();

  return gulp.src('./app/data/core.json')
    .pipe(through2.obj(function(file, _, cb) {
      if (file.isBuffer()) {
        const core = JSON.parse(file.contents.toString());
        Object.entries(core.moves).forEach(([key, group]) => {
          Object.entries(group.contents).forEach(([moveName, moveData]) => {
            if (typeof moveData.text === 'string') {
              moveData.text = converter.makeHtml(moveData.text);
            }
          });
        });
        file.contents = Buffer.from(JSON.stringify(core, null, 2));
      }
      cb(null, file);
    }))
    .pipe(gulp.dest('./app/data'));
});

gulp.task('mergeTranslation', function() {
  return gulp
    .src('app/translations/translation-**.json')
    .pipe(merge({ fileName: 'translation.json' }))
    .pipe(gulp.dest('../'));
});

gulp.task('data', function() {
  return gulp
    .src(['app/data/**/*.json', '../translation.json'], { allowEmpty: true })
    .pipe(
      merge({
        fileName: 'data.json',
        edit: (json, file) => {
          // Extract the filename and strip the extension
          var filename = path.basename(file.path),
            primaryKey = filename.replace(path.extname(filename), '');

          // Set the filename as the primary key for our JSON data
          var data = {};
          data[primaryKey.toLowerCase()] = json;

          return data;
        },
      })
    )
    .pipe(gulp.dest('./temp'));
});

gulp.task('css', () => {
  return gulp
    .src('./app/Ironsworn-starforged.styl')
    .pipe(stylus())
    .pipe(gulp.dest('../'));
});

gulp.task('html', () => {
  return gulp
    .src('./app/Ironsworn-ferunners.pug')
    .pipe(
      data(function() {
        return JSON.parse(fs.readFileSync('./temp/data.json'));
      })
    )
    .pipe(
      pug({
        // pretty: true,
        ...require('./app/pug.config'),
      })
    )
    .pipe(gulp.dest('../'));
});

gulp.task(
  'watch',
  gulp.series(['dataforge', 'mergeTranslation', 'data', 'css', 'html'], () => {
    gulp.watch('./app/**/*.styl', gulp.series(['css']));
    gulp.watch(['./app/**/*.pug', './app/**/*.js'], gulp.series(['html']));
  })
);

gulp.task(
  'build',
  gulp.series(['dataforge', 'convert-markdown', 'mergeTranslation', 'data', 'css', 'html'])
);
