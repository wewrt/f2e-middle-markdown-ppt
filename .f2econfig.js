const { argv } = process
const build = argv[argv.length - 1] === 'build'
const { join } = require('path')

module.exports = {
    livereload: !build,
    build,
    gzip: true,
    useLess: true,
    buildFilter: p => /^test/.test(p),
    middlewares: [
        require('./')
    ],
    output: join(__dirname, './docs'),
}
