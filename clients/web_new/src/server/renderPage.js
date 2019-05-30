import serialize from 'serialize-javascript';

const renderPage = (html, css, preloadedState) => `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>React-material</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            <style id="jss-server-side">${css}</style>
        </head>   
        <body style="margin: 0">
            <div id="app">${html}</div>
            <script src="/bundle.js" defer></script>
            <script>
                window.__PRELOADED_STATE__ = ${serialize(preloadedState)}
            </script>
        </body>
    </html>
`;

export default renderPage;
