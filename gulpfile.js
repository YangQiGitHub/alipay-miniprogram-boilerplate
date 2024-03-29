const gulp = require('gulp');
const less = require('gulp-less');
const rename = require('gulp-rename');
const del = require('del');
const imagemin = require('gulp-imagemin');
const path = require('path');
const eslint = require('gulp-eslint');

const srcPath = './src/**';
const distPath = './dist/';
const axmlFiles = [`${srcPath}/*.axml`, `!${srcPath}/_template/*.axml`];
const lessFiles = [
  `${srcPath}/*.less`,
  `!${srcPath}/styles/**/*.less`,
  `!${srcPath}/_template/*.less`
];
const jsonFiles = [`${srcPath}/*.json`, `!${srcPath}/_template/*.json`];
const jsFiles = [`${srcPath}/*.js`, `!${srcPath}/_template/*.js`];
const imgFiles = [
  `${srcPath}/images/*.{png,jpg,gif,ico}`,
  `${srcPath}/images/**/*.{png,jpg,gif,ico}`
];

/* 清除dist目录 */
gulp.task('clean', done => {
  del.sync(['dist/**/*']);
  done();
});

/* 编译axml文件 */
const axml = () => {
  return gulp
    .src(axmlFiles, { since: gulp.lastRun(axml) })
    .pipe(gulp.dest(distPath));
};
gulp.task(axml);

/* 编译JS文件 */
const js = () => {
  return gulp
    .src(jsFiles, { since: gulp.lastRun(js) })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulp.dest(distPath));
};
gulp.task(js);

/* 编译json文件 */
const json = () => {
  return gulp
    .src(jsonFiles, { since: gulp.lastRun(json) })
    .pipe(gulp.dest(distPath));
};
gulp.task(json);

/* 编译less文件 */
const acss = () => {
  return gulp
    .src(lessFiles)
    .pipe(less())
    .pipe(rename({ extname: '.acss' }))
    .pipe(gulp.dest(distPath));
};
gulp.task(acss);

/* 编译压缩图片 */
const img = () => {
  return gulp
    .src(imgFiles, { since: gulp.lastRun(img)})
    .pipe(imagemin())
    .pipe(gulp.dest(distPath));
};
gulp.task(img);

/* build */
gulp.task(
  'build',
  gulp.series('clean', gulp.parallel( 'axml', 'js', 'json', 'acss', 'img'))
);

/* watch */
gulp.task('watch', () => {
  let watchLessFiles = [...lessFiles];
  watchLessFiles.pop();
  gulp.watch(watchLessFiles, acss);
  gulp.watch(jsFiles, js);
  gulp.watch(imgFiles, img);
  gulp.watch(jsonFiles, json);
  gulp.watch(axmlFiles, axml);
});

/* dev */
gulp.task('dev', gulp.series('build', 'watch'));

/**
 * auto 自动创建page or template or component
 *  -s 源目录（默认为_template)
 * @example
 *   gulp auto -p mypage           创建名称为mypage的page文件
 *   gulp auto -t mytpl            创建名称为mytpl的template文件
 *   gulp auto -c mycomponent      创建名称为mycomponent的component文件
 *   gulp auto -s index -p mypage  创建名称为mypage的page文件
 */
const auto = done => {
  const yargs = require('yargs')
    .example('gulp auto -p mypage', '创建名为mypage的page文件')
    .example('gulp auto -t mytpl', '创建名为mytpl的template文件')
    .example('gulp auto -c mycomponent', '创建名为mycomponent的component文件')
    .example(
      'gulp auto -s index -p mypage',
      '复制pages/index中的文件创建名称为mypage的页面'
    )
    .option({
      s: {
        alias: 'src',
        default: '_template',
        describe: 'copy的模板',
        type: 'string'
      },
      p: {
        alias: 'page',
        describe: '生成的page名称',
        conflicts: ['t', 'c'],
        type: 'string'
      },
      t: {
        alias: 'template',
        describe: '生成的template名称',
        type: 'string',
        conflicts: ['c']
      },
      c: {
        alias: 'component',
        describe: '生成的component名称',
        type: 'string'
      },
      version: { hidden: true },
      help: { hidden: true }
    })
    .fail(msg => {
      done();
      console.error('创建失败!!!');
      console.error(msg);
      console.error('请按照如下命令执行...');
      yargs.parse(['--msg']);
      return;
    })
    .help('msg');

  const argv = yargs.argv;
  const source = argv.s;
  const typeEnum = {
    p: 'pages',
    t: 'templates',
    c: 'components'
  };
  let hasParams = false;
  let name, type;
  for (let key in typeEnum) {
    hasParams = hasParams || !!argv[key];
    if (argv[key]) {
      name = argv[key];
      type = typeEnum[key];
    }
  }

  if (!hasParams) {
    done();
    yargs.parse(['--msg']);
  }

  const root = path.join(__dirname, 'src', type);
  return gulp
    .src(path.join(root, source, '*.*'))
    .pipe(
      rename({
        dirname: name,
        basename: name
      })
    )
    .pipe(gulp.dest(path.join(root)));
};
gulp.task(auto);
