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
// 登录
const users = require("./routes/users")
const router = require("koa-router")()
const jwt = require("jsonwebtoken")
const koajwt = require("koa-jwt")
const utils = require("./utils/utils")
// error handler
onerror(app)
require("./config/db")
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
  await next().catch(err => {
    if (err.status == "401") {
      ctx.status == 200
      ctx.body = utils.fail("TOKEN认证失败", utils.CODE.AUTH_ERROR)
    } else {
      throw err
    }
  })
  log4js.info("log output")
  // const ms = new Date() - start
  // console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
app.use(koajwt({ secret: "imooc" }).unless({ path: [/^\/api\/users\/login/] }))
router.prefix("/api")
router.get("/leave/count", ctx => {
  // const token = ctx.request.headers.authorization.split(" ")[1]
  // // 获取解析token字段
  // const payLoad = jwt.verify(token, "imooc")
  ctx.body = "body"
})
// 挂载user路由
router.use(users.routes(), users.allowedMethods())
// 加载routes
app.use(router.routes(), router.allowedMethods())
// error-handling
app.on("error", (err, ctx) => {
  console.error("server error", err, ctx)
  log4js.error(`${err.stack}`)
})

module.exports = app
