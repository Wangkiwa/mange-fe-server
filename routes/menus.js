/*
 * @Descripttion:菜单路由
 * @Author: TaoWang
 * @Date: 2022-07-14 17:25:07
 */
const router = require("koa-router")()
const utils = require("../utils/utils")
const Menu = require("../models/menuSchema")
router.prefix("/menu")
router.get("/list", async ctx => {
  const { menuName, menuState } = ctx.request.query
  const params = {}
  if (menuName) params.menuName = menuName
  if (menuState) params.menuState = menuState
  let rootList = (await Menu.find(params)) || []
  const permissionList = utils.getTreeMenu(rootList, null, [])
  ctx.body = utils.success(permissionList)
})

// 新增/编辑。删除
router.post("/operate", async ctx => {
  const { _id, action, ...params } = ctx.request.body
  let res, info
  try {
    if (action == "add") {
      // 添加
      res = await Menu.create(params)
      info = "创建成功！"
    } else if (action == "edit") {
      // 编辑
      params.updateTime = new Date()
      res = await Menu.findByIdAndUpdate(_id, params)
      info = "编辑成功"
    } else {
      // 删除
      res = await Menu.findByIdAndRemove(_id)
      await Menu.deleteMany({ parentId: { $all: [_id] } }) //查询包含父id的所有文档
      info = "删除成功"
    }
    ctx.body = utils.success("", info)
  } catch (error) {
    ctx.body = utils.fail(error.stack)
  }
})
module.exports = router
