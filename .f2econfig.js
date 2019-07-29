const { argv } = process
const build = argv[argv.length - 1] === 'build'
const { join } = require('path')
const { readFileSync, existsSync } = require('fs')

let password = undefined
if (existsSync(join(__dirname, '.password'))) {
    password = readFileSync(join(__dirname, '.password')).toString()
}

module.exports = {
    livereload: !build,
    build,
    gzip: true,
    useLess: true,
    buildFilter: p => /^test/.test(p),
    middlewares: [
        (conf) => require('./')(conf, { password })
    ],
    output: join(__dirname, './docs'),
}
