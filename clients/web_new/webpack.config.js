const path = require('path');
const NodemonPlugin = require('nodemon-webpack-plugin');

const config = {
  mode: process.env.NODE_ENV || 'development',
  module: {
    rules: [{ test: /\.(js)$/, use: 'babel-loader', exclude: /node_modules/ }],
  },
  resolve: {
    modules: [path.resolve('./src/shared'), 'node_modules'],
  },
};

const clientConfig = {
  ...config,
  entry: ['./src/bootstrap.js', './src/client/index.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
};

const serverConfig = {
  ...config,
  entry: ['./src/bootstrap.js', './src/server/index.js'],
  target: 'node',
  output: {
    path: path.resolve(__dirname),
    filename: 'server.js',
    publicPath: '/',
  },
  plugins: [new NodemonPlugin()],
};

module.exports = [clientConfig, serverConfig];
