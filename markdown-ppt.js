(function () {
    "use strict";
    const {
        mode
    } = (function (query) {
        let obj = {}
        query.replace(/(\w+)=([^\?\&]+)/g, function (_a, k, v) {
            obj[k] = v
        })
        return obj
    })(location.search);
    document.body.classList.add(mode);

    let online = true;
    let index = location.hash && Number(location.hash.substring(1)) || 0;

    const sections = document.querySelectorAll('section.hero');

    let token = localStorage.getItem('_MDPPT_TOKEN_')
    const pageTo = (n, withFetch) => {
        n = Math.min(n, sections.length - 1);
        n = Math.max(n, 0);

        const prev = sections.item(index)
        prev.classList.remove(prev.dataset['animated'])
        prev.classList.remove('active')

        const current = sections.item(n)
        current.classList.add(current.dataset['animated'])
        current.classList.add('active')

        index = n
        location.hash = '#' + index
        if (online && withFetch) {
            let _token = token || prompt('token:')
            if (_token) {
                fetch(`/markdown-ppt-event?index=${index}&token=${_token}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        localStorage.setItem('_MDPPT_TOKEN_', _token)
                    }
                    token = res.success && _token
                })
            }
        }
    }
    const next = () => pageTo(index + 1, mode === 'speaker');
    const prev = () => pageTo(index - 1, mode === 'speaker');

    pageTo(index)

    addEventListener('keyup', e => {
        switch (e.keyCode) {
            case 38:
                prev();
                break;
            case 40:
                next();
                break;
            default:
                break;
        }
    });

    let swipe = null
    addEventListener('touchstart', e => {
        const { pageX, pageY } = e.touches[0];
        swipe = { pageX, pageY }
    })
    addEventListener('touchend', e => {
        swipe = null
    })
    addEventListener('touchmove', e => {
        const { pageX, pageY } = e.touches[0];
        if (swipe) {
            if (swipe.pageY - pageY > 30) {
                next()
                swipe = null
            } else if (swipe.pageY - pageY < -30) {
                prev()
                swipe = null
            }
        }
    })

    let _n = 0
    const createSSE = function createSSE () {
        const sse = new EventSource('/markdown-ppt-event', { withCredentials: true });
        const onMessage = e => {
            if (e.data != 'false') {
                pageTo(Number(e.data) % sections.length)
            }
        };
        const onError = e => {
            online = false
            sse.removeEventListener('message', onMessage)
            sse.removeEventListener('error', onError)
            setTimeout(createSSE, ++_n * 1000);
        }
        sse.addEventListener('message', onMessage)
        sse.addEventListener('error', onError)
    }
    createSSE();


    // imageview
    const preview = document.querySelector('#image-preview')
    preview.addEventListener('dblclick', e => {
        preview.classList.remove('is-active')
    })
    addEventListener('click', e => {
        const target = e.target
        if (target.matches('.content img')) {
            preview.querySelector('.image-preview').innerHTML = `<img src="${target.src}"/>`
            preview.classList.add('is-active')
        }
        if (target.matches('.modal-close')) {
            preview.classList.remove('is-active')
        }
    })
    
})()