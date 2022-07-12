const router = require("koa-router")()
const User = require("../models/userSchema")
const utils = require("../utils/utils")
const jwt = require("jsonwebtoken")
router.prefix("/users")
router.post("/login", async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body
    /* 
      返回数据库指定字段，有三种方式
      1、'userId  userName   userEmail  state role'
      2、{userId:1,_id:0}
      3、.select('userId')
    */
    const res = await User.findOne(
      {
        userName,
        userPwd,
      },
      { userId: 1, userName: 1 }
    )
    const data = res._doc
    // 生成token
    const token = jwt.sign(
      {
        data,
      },
      "imooc",
      { expiresIn: "1h" }
    )
    if (res) {
      data.token = token
      ctx.body = utils.success(data)
    } else {
      ctx.body = utils.fail("账号或密码不正确")
    }
  } catch (error) {
    ctx.body = utils.fail(error.msg)
  }
})
module.exports = router
