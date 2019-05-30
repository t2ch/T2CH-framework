import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

import {
  ThemeProvider,
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/styles';

import rootReduser from '&/shared/redusers/rootReduser';

import App from '&/shared/App';
import watcherSaga from '&/shared/sagas/rootSaga';
import theme from '&/shared/theme';

function Main() {
  useEffect(() => {
    const jssStyles = document.getElementById('jss-server-side');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  }, []);

  return <App />;
}

const generateClassName = createGenerateClassName();

const preloadedState = window.__PRELOADED_STATE__;

delete window.__PRELOADED_STATE__;

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  rootReduser,
  preloadedState,
  compose(
    applyMiddleware(sagaMiddleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
);

sagaMiddleware.run(watcherSaga);

ReactDOM.hydrate(
  <Provider store={store}>
    <StylesProvider generateClassName={generateClassName}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SnackbarProvider maxSnack={3}>
            <Main />
          </SnackbarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StylesProvider>
  </Provider>,
  document.getElementById('app')
);
