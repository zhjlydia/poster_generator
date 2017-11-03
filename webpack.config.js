var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: ["babel-polyfill",'./src/main.js'],
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'build.js'
  },
  module: {
    rules: [{
      loader: 'babel-loader',
      test: /\.js$/,
      exclude: /(node_modules)/,
      query: {
        presets: 'es2015'
      }
    }, {
      test: /\.(png|jpg|gif)$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]?[hash]'
      }
    }, {
      test: /\.css$/,
      loader: ['style-loader', 'css-loader']
    }, {
      test: /\.html$/,
      loader: "html-loader"
    }]
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      'basePath': __dirname + "/src" //app 根目录
    }
  },
  devtool: '#eval-source-map',
  externals: {
    'EXIF': "EXIF",
  }
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}