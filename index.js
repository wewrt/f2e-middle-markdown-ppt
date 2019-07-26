const marked = require('marked')
const fs = require('fs')
const path = require('path')

const renderHead = (meta) => meta.split(/\n/).map(line => {
    const [ k, ...other ] = line.split(/\:/)
    const v = other.join(':').trim()
    if (v.trim()) {
        switch (k) {
            case 'title': return `<title>${v}</title>`;
            case 'style': return v.split(/\s*,\s*/).map(href => `<link href="${href.trim()}" rel="stylesheet">`).join('\n\t');
            case 'script': return v.split(/\s*,\s*/).map(src => `<script src="${src.trim()}"></script>`).join('\n\t');
            case 'author':
            case 'keywords': return `<meta name="${k}" content="${v}"/>`;
            default: return ''
        }
    } else {
        return ''
    }
}).join('\n\t')

const section = fs.readFileSync(path.join(__dirname, './section.html')).toString()
const renderSection = (markedCfg) => (content) => {
    const [baseline, ...other] = content.split('\n')
    const base = {}
    baseline.replace(/(\w+)="(.*?)"/g, (_a, k, v) => base[k] = v);
    base.content = marked(other.join('\n'), markedCfg);
    return section.replace(/\{\{(\w+)\}\}/g, (_a, k) => base[k] || '');
}

const template = fs.readFileSync(path.join(__dirname, './index.html')).toString()
const script = fs.readFileSync(path.join(__dirname, './markdown-ppt.js')).toString()
const renderHTML = (content, { markedCfg }) => {
    const [meta, ...sections] = content.split(/\n(?=\[page)/);
    const data = {
        head: renderHead(meta),
        body: sections.map(renderSection(markedCfg)).join('\n'),
        script: `<script>${script}</script>`
    }
    return template.replace(/\{\{(\w+)\}\}/g, (_a, k) => data[k] || '')
}

module.exports = (conf, options = {}) => {
    const {
        setBefore,
        suffix = 'ppt.md',
        outputSuffix = 'html',
        markedCfg = {},
        password = 'iamshy2850',
        test = /\.ppt\.md$/
    } = options

    let responseSet = new Set([])
    const serverSent = (req, resp) => {
        resp.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        })
        responseSet.add(resp)
        req.connection.addListener('close', () => {
            responseSet.delete(resp)
            resp.end()
        }, false)
    }


    let heartBreakTimeout
    const send = function heartBreak(data) {
        for (let res of responseSet) {
            res.write(`data:${data}\n\n`)
        }
        clearTimeout(heartBreakTimeout)
        heartBreakTimeout = setTimeout(function () {
            // keep SSE-connection by sending message per 100s
            heartBreak(false)
        }, 1000 * 100)
    }

    const suffixReg = new RegExp(`\\.${suffix}$`)
    const render = function (pathname, data, store) {
        if (test.test(pathname)) {
            return {
                outputPath: pathname.replace(suffixReg, `.${outputSuffix}`),
                data: renderHTML(data.toString(), { markedCfg })
            }
        }
    }


    const onRoute = (pathname, req, resp) => {
        if (pathname === 'markdown-ppt-event') {
            if (req.headers['accept'] === 'text/event-stream') {
                serverSent(req, resp)
                send(false)
            } else {
                const { index, token } = req.data
                if (token === password) {
                    send(index)
                    resp.end('{"success": true}')
                } else {
                    resp.end('{"error": "token invalid!"}')
                }
            }
            return false
        }
    }
    return {
        setBefore,
        onSet: render,
        onRoute
    }
}