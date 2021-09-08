const {src, dest, series, parallel} = require('gulp');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const browserSync = require('browser-sync');
const rename = require('gulp-rename');
const del = require('del');

// scss
const sass = require('gulp-sass')(require('sass'));
const Fiber = require('fibers');
const autoprefixer = require('gulp-autoprefixer');
const group = require('gulp-group-css-media-queries');
const csso = require('gulp-csso');

// js
const babel = require('gulp-babel');
const uglifyEs = require('gulp-uglify-es').default;

// html
const fileinclude = require('gulp-rigger');

// clean
const clean = () => {
    return del(['build']);
}

// scss
const stylesBuild = () => {
    return src('./dev/static/sass/*.{scss,sass}')
        .pipe(sass({
            fiber: Fiber, // оптимизация компиляции (прирост скорости примерно 10-15%)
        }))
        .on('error', notify.onError(function (error) {
            return {
                title: 'SASS',
                message: error.message
            };
        }))
        .pipe(group())
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(dest('build/static/css')) // сохраняем обычный (рабочий вариант)
        .pipe(csso()) // минифицируем
        .pipe(rename({suffix: '.min'})) // переименовываем
        .pipe(dest('build/static/css')) // минифицируем
}

const stylesDev = () => {
    return src('./dev/static/sass/*.{scss,sass}')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({
            fiber: Fiber,
        }))
        .on('error', notify.onError(function (error) {
            return {
                title: 'SASS',
                message: error.message
            };
        }))
        .pipe(sourcemaps.write())
        .pipe(rename({suffix: '.min'}))  // переименовываем (просто чтобы в разработке сразу указать минифицированный файл и при билде не менять)
        .pipe(plumber.stop())
        .pipe(dest('build/static/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
}

// js
const scriptBuild = () => {
    return src('dev/static/js/*')
        .pipe(dest('build/static/js/')) // сохраняем обычный (рабочий вариант)
        .pipe(babel({
            presets: ['@babel/env']
        })) // прогоняем через babel
        .pipe(uglifyEs()) // минификация
        .pipe(rename({suffix: '.min'})) // переименовываем
        .pipe(dest('build/static/js/')) // сохраняем минифицированный
}

const scriptDev = () => {
    return src('dev/static/js/*')
        .pipe(plumber())
        .pipe(rename({suffix: '.min'})) // переименовываем (просто чтобы в разработке сразу указать минифицированный файл и при билде не менять)
        .pipe(plumber.stop())
        .pipe(dest('build/static/js/'))
        .pipe(browserSync.reload({
            stream: true
        }))
}

// html
const htmlDev = () => {
    return src('dev/*.html') // ['dev/**/*.html', '!dev/blocks/*.html']
        .pipe(plumber())
        .pipe(fileinclude())
        .pipe(plumber.stop())
        .pipe(dest('build/'))
        .pipe(browserSync.reload({
            stream: true
        }))
}

// fonts
const fonts = () => {
    return src('dev/static/fonts/**/*')
      .pipe(dest('build/static/fonts/'))
}

exports.default = series(clean, parallel(stylesDev, scriptDev, htmlDev, fonts));
exports.build = series(clean, parallel(stylesBuild, scriptBuild, fonts));