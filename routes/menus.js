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
  const permissionList = getTreeMenu(rootList, null, [])
  ctx.body = utils.success(permissionList)
})
// 递归拼接树形列表
function getTreeMenu(rootList, id, list) {
  // 刚开始会先把最外层结构遍历出来
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i]
    // 第一次 null = null  数组中push的是最外层结构
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
    // 追加children属性
    item.children = []
    getTreeMenu(rootList, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children
    } else if (item.children.length > 0 && item.children[0].menuType == 2) {
      // 快速区分按钮和菜单，用于后期做菜单按钮权限控制
      item.action = item.children
    }
  })
  return list
}
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
