const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const buildPath = path.resolve(__dirname, './dist_front');
const contextPath = path.resolve(__dirname, './src_front');

const config = {
  target: 'web',
  context: contextPath,
  devtool: 'source-map',
  output: {
    path: buildPath,
    filename: 'index.js',
    devtoolModuleFilenameTemplate: 'file://[absoluteResourcePath]'
  },
  entry: ['babel-polyfill', './index.js'],
  'module': {
    'rules': [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            'presets': [
              ['env', {
                'targets': {
                  'browsers': ['last 2 Chrome versions']
                }
              }]
            ],
            'plugins': [

            ]
          }
        }
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '/[path]/[hash].[ext]'
        }
      },
      {
        test: /\.(eot|ttf|woff2|woff)$/,
        loader: 'url-loader',
        options: {
          limit: 100000
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'index.html' },
      { from: 'vendor/*', to: 'vendor/[name].[ext]'},
      { from: 'style.css' }
    ])
  ]
};

module.exports = config;