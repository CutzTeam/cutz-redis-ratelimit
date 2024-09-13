const { src, dest, series } = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

function build() {
  return tsProject.src()
    .pipe(tsProject())
    .pipe(dest('dist'));
}

exports.default = series(build);