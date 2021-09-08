const {src, dest, series, parallel, watch} = require('gulp');
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

// images
const imagemin = require('gulp-imagemin');
const spritesmith = require('gulp.spritesmith');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

// clean
const clean = () => {
    return del(['build']);
}

// scss
const stylesBuild = () => {
    return src('dev/static/sass/*.{scss,sass}')
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
    return src('dev/static/sass/*.{scss,sass}')
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
const html = () => {
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

// images
const imagesDev = () => {
    return src([
        'dev/static/img/**/*.{gif,png,jpg,svg}',
        '!dev/static/img/icon-png/*.png',
        '!dev/static/img/svg/*.svg'
    ])
        .pipe(dest('build/static/img/'));
}

const imagesBuild = () => {
    return src([
        'dev/static/img/**/*.{gif,png,jpg,svg}',
        '!dev/static/img/icon-png/*.png',
        '!dev/static/img/svg/*.svg'
    ])
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 85, progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest('build/static/img/'));
}

const createSpritePng = () => {
    const spriteData = src('dev/static/img/icon-png/*.png')
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      padding: 10
    }));
    spriteData.css.pipe(dest('dev/static/sass/utils'));
    return spriteData.img.pipe(dest('build/static/img/'));
}

const createSpriteSvgColor = () => {
    return src('dev/static/img/svg/*.svg')
	    // minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "sprite.svg",
				}
			}
		}))
		.pipe(dest('build/static/img'));
}

const createSpriteSvgBlack = () => {
    return src('dev/static/img/svg/*.svg')
	    // minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				// $('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "sprite.svg",
				}
			}
		}))
		.pipe(dest('build/static/img'));
}

const serve = () => {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    })
}

const watchFile = () => {
    watch('dev/static/sass/**/*.+(sass|scss)', series(stylesDev))
    watch('dev/**/*.html', series(html))
    watch('dev/static/js/*.js', series(scriptDev))
    watch('dev/static/img/**/*', series(imagesDev))
}

exports.default = series(
    clean,
    parallel(stylesDev, scriptDev, html, fonts, imagesDev),
    parallel(watchFile, serve)
);
exports.build = series(clean, parallel(stylesBuild, scriptBuild, html, fonts, imagesBuild));

exports.spritepng = createSpritePng;
exports.spritesvgcolor = createSpriteSvgColor;
exports.spritesvgblack = createSpriteSvgBlack;