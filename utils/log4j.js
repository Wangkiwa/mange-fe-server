/* 
  log4js
*/
const log4js = require("log4js")
// 定义日志级别
const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
}
log4js.configure({
  // 日志输出位置
  appenders: {
    console: { type: "console" },
    info: {
      type: "file",
      filename: "logs/all-logs.log",
    },
    error: {
      type: "dateFile",
      filename: "logs/log",
      pattern: "yyyy-MM-dd.log",
      alwaysIncludePattern: true, // 设置文件名称为 filename + pattern
    },
  },
  categories: {
    // 默认的输出种类
    default: { appenders: ["console"], level: "debug" },
    info: {
      // 通知appenders
      appenders: ["info", "console"],
      level: "info",
    },
    error: {
      appenders: ["error", "console"],
      level: "error",
    },
  },
})
/* 
  level为debug的日志输出
*/
exports.debug = content => {
  let logger = log4js.getLogger("debug")
  logger.level = levels.debug
  logger.debug(content)
}
/* 
  level为info的日志输出
*/
exports.info = content => {
  // 获取log4js的实例传入info就去找categories中的info配置
  let logger = log4js.getLogger("info")
  // 日志为info等级
  logger.level = levels.info
  // 传入的信息
  logger.info(content)
}
/* 
  level为error的日志输出
*/
exports.error = content => {
  let logger = log4js.getLogger("error")
  logger.level = levels.error
  logger.error(content)
}
