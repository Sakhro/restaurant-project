const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');


gulp.task('default', () => {
    gulp.watch('css/sass/*.scss', ['styles'])
});

gulp.task('styles', () => {
    gulp.src('css/sass/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest('./css'));
});

gulp.task('images', () => {
    gulp.src('img/img_src/*')
        .pipe(imagemin([
            imagemin.jpegtran({progressive: true}),
        ]))
        .pipe(gulp.dest('./img'))
});
