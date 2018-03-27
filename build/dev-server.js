/**
 * Created by cmq on 2018/3/26.
 */
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var opn = require('opn') // 强制打开浏览器
var proxyMiddleware = require('http-proxy-middleware')
var config = require('../config')
var webpackConfig = require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()
var compiler = webpack(webpackConfig)

// webpack-dev-middleware的作用
// 1.将编译后的生成的静态文件放在内存中,所以在npm run dev后磁盘上不会生成文件
// 2.当文件改变时,会自动编译。
// 3.当在编译过程中请求某个资源时，webpack-dev-server不会让这个请求失败，而是会一直阻塞它，直到webpack编译完毕
var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  stats: {
    colors: true,
    chunks: false
  }
})

//webpack-hot-middleware的作用就是实现浏览器的无刷新更新
var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})

// 声明hotMiddleware无刷新更新的时机:html-webpack-plugin 的template更改之后
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// 将代理请求的配置应用到express服务上
// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(context, options))
})

// handle fallback for HTML5 history API
// 使用connect-history-api-fallback匹配资源
// 如果不匹配就可以重定向到指定地址
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
// 配置express静态资源目录
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

module.exports = app.listen(port, function (err) {
  if (err) {
    console.log(err)
    return
  }
  var uri = `http://localhost:${port}`
  console.log(`Frontend listening at ${uri}`)
  opn(uri)
})