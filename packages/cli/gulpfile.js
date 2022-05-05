const gulp = require('gulp')
const chmod = require( 'gulp-chmod')
const inject = require( 'gulp-inject-string')

gulp.task('execute',() => {
return gulp.src('bin/main.js')
	.pipe(inject.prepend('#!/usr/bin/env node\n\n'))
	.pipe(chmod({
		execute: true
	}))
	.pipe(gulp.dest('bin'))
} )