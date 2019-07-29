# f2e-middle-markdown-ppt
markdown-ppt for f2e-server

## Usage

`npm i f2e-middle-markdown-ppt`

`.f2econfig.js`
```
{
    ...conf,
    middlewares: [
        { middleware: 'markdown-ppt', password: 'iamspeaker yeh!' }
    ]
}
```

`npm start`

## View
1. visit `.ppt.md` replace with `.html`.
2. use `?mode=speaker` to handle page prev/next.
3. enjoy!
