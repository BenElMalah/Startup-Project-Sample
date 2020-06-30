var gulp = require('gulp'),
	gulpif = require('gulp-if'),
	sourcemaps = require('gulp-sourcemaps'),
	sass = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	cleanCSS = require('gulp-clean-css'),
	plumber = require('gulp-plumber'),
	concat = require('gulp-concat'),
	gulpwebpack = require('webpack-stream'),
	babel = require('gulp-babel'),
	uglify = require('gulp-uglify'),
	vname = require('vinyl-named'),
	rename = require('gulp-rename'),
	imagemin = require('gulp-imagemin'),
	del = require('del'),
	ftp = require('vinyl-ftp'),
	compress = require('gulp-zip'),
	pug = require('gulp-pug'),
	browserSync = require('browser-sync').create(),
	mode = require('gulp-mode')({
			  modes: ["production", "development"],
			  default: "development",
			  verbose: false
			});


var paths = {
	styles: {
		src: 'src/css/main.scss',
		dest: 'dist/css'
	},
	scripts: {
		src: 'src/js/*.js',
		dest: 'dist/js'
	},
	images: {
		src: 'src/images/**/*.{png, jpeg, jpg , svg, gif}',
		dest: 'dist/images'
	},
	other: {
		src: ['src/**/*', '!src/js/*.js', '!src/{js, css, images}', '!src/{js, css, images}/*.{css, js, images}', '!src/{css, js, images}/**/*'],
		dest: 'dist'
	},
	package: {
		src: ['**/*', '!.vscode', '!node_modules/{,/**}', '!packaged{,/**}', '!src{,/**}', '!.babelrc',
		'!.gitignore', '!gulpfile.js', '!gulpfile.babel.js','!package.json', '!package.lock.json'],
		dest: 'packaged'
	}
};

gulp.task('serve', function(done) {
    browserSync.init({
        proxy: "http://localhost/proj1"
    });
    done();
});

gulp.task('reload', function(done){
	browserSync.reload();
	done();
})

gulp.task('styles', function () {
	return gulp.src(paths.styles.src)
	  .pipe(plumber())
	  .pipe(gulpif(mode.development, sourcemaps.init()))
	  .pipe(gulpif(mode.development, sass(), sass({outputStyle: 'compressed'})))
	  .pipe(autoprefixer('last 2 versions'))
	  .pipe(concat('main.css'))
	  .pipe(cleanCSS())
	  .pipe(gulpif(mode.development, sourcemaps.write('.')))
	  .pipe(rename({suffix: '.min'}))
	  .pipe(gulp.dest(paths.styles.dest))
	  .pipe(browserSync.stream());
});

gulp.task('scripts', function () {
	return gulp.src(paths.scripts.src)
	  .pipe(vname())
      .pipe(gulpwebpack({
	      devtool: 'source-map',
	      output: {
	        filename: '[name].js',
	      },
	      mode: 'development'
	    }))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('images', function(){
	return gulp.src(paths.images.src)
	  .pipe(gulpif(mode.production, imagemin()))
	  .pipe(gulp.dest(paths.images.dest));
});

gulp.task('copy', function(){
	return gulp.src(paths.other.src)
	  .pipe(gulp.dest(paths.other.dest));
});

gulp.task('clean', function(){
	return del(['dist']);
});

gulp.task('compress', function(){
	return gulp.src(paths.package.src)
	  .pipe(compress('project.zip'))
	  .pipe(gulp.dest(paths.package.dest));
});

gulp.task('deploy', function(){

	 var conn = ftp.create( {
        host:     'mywebsite.tld',
        user:     'me',
        password: 'mypass',
        parallel: 10,
    } );
 
    return gulp.src( ['dist/**/*.*'], { base: '.', buffer: false } )
        .pipe(conn.newer('/public_html')) // only upload newer files
        .pipe(conn.dest('/public_html'));
});

gulp.task('watch', function(done){
	gulp.watch(['*.php','**/*.php'], gulp.series('reload'));
	gulp.watch('src/css/**/*.scss', gulp.series('styles'));
	gulp.watch('src/js/**/*.js', gulp.series('scripts', 'reload'));
	gulp.watch(paths.images.src, gulp.series('images', 'reload'));
	gulp.watch(paths.other.src, gulp.series('copy', 'reload'));
	//gulp.watch('dist/**/*.*', ['compress', 'reload']);
	done();
});

gulp.task('dev', gulp.series('clean', ['styles', 'scripts', 'images'], 'copy', 'serve', 'watch'));
gulp.task('build', gulp.series('clean', ['styles', 'scripts', 'images', 'copy']), 'serve');
gulp.task('bundle', gulp.series('build', 'compress'));

gulp.task('default', gulp.series('dev', function(done) { 
    done();
}));