const Koa = require("koa")
const app = new Koa()
const views = require("koa-views")
// 把参数转成json
const json = require("koa-json")
// 错误提示
const onerror = require("koa-onerror")
// 用于请求数据的转换，无需序列化
const bodyparser = require("koa-bodyparser")
// 日志
// const logger = require("koa-logger")
const log4js = require("./utils/log4j")

const index = require("./routes/index")
const users = require("./routes/users")

// error handler
onerror(app)

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
)
app.use(json())
// app.use(logger())
app.use(require("koa-static")(__dirname + "/public"))

app.use(
  views(__dirname + "/views", {
    extension: "ejs",
  })
)

// logger
app.use(async (ctx, next) => {
  // const start = new Date()
  await next()
  log4js.info("log output")
  // const ms = new Date() - start
  // console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// 加载routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on("error", (err, ctx) => {
  console.error("server error", err, ctx)
  log4js.error(`${err.stack}`)
})

module.exports = app
