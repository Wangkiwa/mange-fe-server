/* 
  数据库链接
*/
const log4j = require("./../utils/log4j.js")
const config = require("./index")

const mongoose = require("mongoose")
mongoose.connect(config.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const db = mongoose.connection
db.on("error", () => {
  log4j.error("数据库连接失败")
})
db.once("open", () => {
  log4j.info("数据库连接成功")
})
