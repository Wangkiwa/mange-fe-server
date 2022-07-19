/*
 * @Descripttion: 角色路由
 * @Author: TaoWang
 * @Date: 2022-07-16 12:27:33
 */
const router = require("koa-router")()
const utils = require("../utils/utils")
const Role = require("../models/roleSchema")
router.prefix("/roles")
// 角色列表
router.get("/allList", async ctx => {
  try {
    const list = await Role.find({}, "_id roleName")
    ctx.body = utils.success(list)
  } catch (error) {
    ctx.body = utils.fail(`查询失败:${error.stack}`)
  }
})
// 按页获取角色列表
router.get("/list", async ctx => {
  const { roleName } = ctx.request.query
  const { page, skipIndex } = utils.pager(ctx.request.query)
  try {
    let params = {}
    // 过滤roleName
    if (roleName) params.roleName = roleName
    const query = Role.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Role.countDocuments(params)
    ctx.body = utils.success({
      list,
      page: {
        ...page,
        total,
      },
    })
  } catch (error) {
    ctx.body = utils.fail(`查询失败:${error.stack}`)
  }
})
// 角色操作： 创建、编辑和删除
router.post("/operate", async ctx => {
  const { _id, roleName, remark, action } = ctx.request.body
  let res, info
  try {
    if (action == "create") {
      // 创建
      res = new Role({
        roleName,
        remark,
      })
      res.save()
      info = "创建成功"
    } else if (action == "edit") {
      if (_id) {
        // 编辑
        let params = { roleName, remark }
        params.update = new Date()
        res = await Role.findByIdAndUpdate(_id, params)
        info = "编辑成功"
      } else {
        ctx.body = utils.fail("缺少参数_id")
        return
      }
    } else {
      if (_id) {
        // 删除
        res = await Role.findByIdAndRemove(_id)
        info = "删除成功"
      } else {
        ctx.body = utils.fail("缺少参数_id")
        return
      }
    }
    ctx.body = utils.success(res, info)
  } catch (error) {
    ctx.body = utils.fail(error.stack)
  }
})
// 权限设置
router.post("/update/permission", async ctx => {
  const { _id, permissionList } = ctx.request.body
  try {
    let params = { permissionList, update: new Date() }
    let res = await Role.findByIdAndUpdate(_id, params)
    ctx.body = utils.success("", "权限设置成功")
  } catch (error) {
    ctx.body = utils.success(`权限设置失败${error}`)
  }
})
module.exports = router
