/*
 * @Descripttion:部门路由
 * @Author: TaoWang
 * @Date: 2022-07-17 19:27:08
 */
const router = require("koa-router")()
const utils = require("../utils/utils")
const Dept = require("../models/deptSchema")
router.prefix("/dept")
// 部门列表
router.get("/list", async ctx => {
  let { deptName } = ctx.request.query
  let params = {}
  if (deptName) params.deptName = deptName
  const rootList = await Dept.find(params)
  if (deptName) {
    ctx.body = utils.success(rootList)
  } else {
    let tressList = getTreeDept(rootList, null, [])
    ctx.body = utils.success(tressList)
  }
})
// 递归拼接树形列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i]
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
    item.children = []
    getTreeDept(rootList, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children
    }
  })
  return list
}
// 部门操作： 创建、编辑、删除
router.post("/operate", async ctx => {
  const { _id, action, ...params } = ctx.request.body
  console.log("action==>", action)
  console.log("params=>", params)
  let res, info
  try {
    if (action == "create") {
      res = await Dept.create(params)
      console.log("res==>", res)
      info = "创建成功"
    } else if (action == "edit") {
      // 修改时间
      params.updateTime = new Date()
      await Dept.findByIdAndUpdate(_id, params)
      info = "编辑成功"
    } else {
      await Dept.findByIdAndRemove(_id)
      await Dept.deleteMany({ parentId: { $all: [_id] } }) //删除parentId 中包含和_id相等的
      info = "删除成功"
    }
    ctx.body = utils.success("", info)
  } catch (error) {
    ctx.body = utils.success("", info)
  }
})
module.exports = router
