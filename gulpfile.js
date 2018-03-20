const gulp = require('gulp');
const sass = require('gulp-sass');
const minify = require('gulp-babel-minify');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');


gulp.task('default', () => {
    gulp.watch('client/css/sass/*.scss', ['styles']);
    gulp.watch('client/js/dev/*.js', ['scripts'])
});

gulp.task('styles', () => {
    gulp.src('client/css/sass/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest('./client/css'));
});

gulp.task('images', () => {
    gulp.src('client/img/img_src/*')
        .pipe(imagemin([
            imagemin.jpegtran({progressive: true}),
        ]))
        .pipe(gulp.dest('./client/img'))
});

gulp.task('scripts', () => {
    gulp.src('client/js/dev/*.js')
        .pipe(minify({
            mangle: {
                keepClassName: true
            }
        }))
        .pipe(gulp.dest('./client/js'))
});
