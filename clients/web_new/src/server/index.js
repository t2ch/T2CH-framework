import express from 'express';
import cors from 'cors';

import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToString } from 'react-dom/server';

import {
  ThemeProvider,
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/styles';
import { create, SheetsRegistry } from 'jss';
import jssPreset from 'jss-preset-default';

import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

import config from '~/config';
import renderPage from '&/server/renderPage';
import App from '&/shared/App';
import rootReduser from '&/shared/redusers/rootReduser';
import theme from '&/shared/theme';

const app = express();

app.use(cors());
app.use(express.static('dist'));

app.get('*', (req, res) => {
  const context = {};
  const store = createStore(rootReduser);

  const sheetsRegistry = new SheetsRegistry();
  const sheetsManager = new Map();
  const generateClassName = createGenerateClassName();
  const jss = create(jssPreset());

  const html = renderToString(
    <Provider store={store}>
      <StylesProvider
        jss={jss}
        sheetsRegistry={sheetsRegistry}
        sheetsManager={sheetsManager}
        generateClassName={generateClassName}
      >
        <ThemeProvider theme={theme}>
          <StaticRouter location={req.url} context={context}>
            <SnackbarProvider maxSnack={3}>
              <App />
            </SnackbarProvider>
          </StaticRouter>
        </ThemeProvider>
      </StylesProvider>
    </Provider>
  );

  const css = sheetsRegistry.toString();

  const preloadedState = store.getState();
  res.send(renderPage(html, css, preloadedState));
});

app.listen(config.port, () => {
  console.log(`app started on port ${config.port}`);
});
