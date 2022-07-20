/*
 * @Descripttion:用户路由
 * @Author: TaoWang
 * @Date: 2022-07-09 13:48:04
 */
const router = require("koa-router")()
const User = require("../models/userSchema")
const Menu = require("../models/menuSchema")
const Role = require("../models/roleSchema")
const utils = require("../utils/utils")
const Counter = require("../models/counterSchema")
const jwt = require("jsonwebtoken")
const md5 = require("md5")
router.prefix("/users")
// 用户登录
router.post("/login", async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body
    /* 
      返回数据库指定字段，有三种方式
      1、'userId  userName   userEmail  state role'
      2、{userId:1,_id:0}
      3、.select('userId')
    */
    let res = await User.findOne(
      {
        userName,
        userPwd,
      },
      "userId userName userEmail state role deptId roleList"
    )
    if (res) {
      let data = res._doc
      // 生成token
      const token = jwt.sign(
        {
          data,
        },
        "imooc",
        { expiresIn: "24h" }
      )
      data.token = token
      ctx.body = utils.success(data)
    } else {
      ctx.body = utils.fail("账号或密码不正确")
    }
  } catch (error) {
    ctx.body = utils.fail(error.msg)
  }
})
// 用户列表
router.get("/list", async ctx => {
  const { userId, userName, state } = ctx.request.query
  const { page, skipIndex } = utils.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state !== "0") params.state = state
  try {
    const query = User.find(params, { _id: 0, userPwd: 0 })
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)
    ctx.body = utils.success({
      page: {
        ...page,
        total,
      },
      list,
    })
  } catch (error) {
    ctx.body = utils.fail(`查询异常：${error}`)
  }
})
// 用户删除
router.post("/delete", async ctx => {
  const { userIds } = ctx.request.body
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  if (res.modifiedCount) {
    ctx.body = utils.success(res, `共删除成功${res.modifiedCount}条`)
    return
  }
  ctx.body = utils.fail("删除失败！")
})
//  用户新增/编辑
router.post("/operate", async ctx => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action,
  } = ctx.request.body
  if (action == "add") {
    // 新增
    if (!userName || !userEmail || !deptId) {
      ctx.body = utils.fail("参数错误", utils.CODE.PARAM_ERROR)
      return
    }
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      "_id userName userEmail"
    )
    if (res) {
      ctx.body = utils.fail(
        `系统监测到有重复的用户,信息如下:${res.userName}- ${res.userEmail}`
      )
    } else {
      const doc = await Counter.findOneAndUpdate(
        { _id: "userId" },
        { $inc: { sequence_value: 1 } }
      )
      try {
        // 生成新的文档
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userPwd: 123456, //默认密码
          userEmail,
          role: 1,
          job,
          state,
          deptId,
          mobile,
        })
        user.save()
        ctx.body = utils.success({}, "用户创建成功!")
      } catch (error) {
        ctx.body = utils.fail(error.stack, "用户创建失败!")
      }
    }
  } else {
    // 编辑
    if (!deptId) {
      ctx.body = utils.fail("部门不能为空", utils.CODE.PARAM_ERROR)
      return
    }
    try {
      const res = await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      )
      ctx.body = utils.success({}, "更新成功!")
    } catch (error) {
      ctx.body = utils.fail(error.stack, "更新失败!")
    }
  }
})
// 获取全量用户列表
router.get("/all/list", async ctx => {
  try {
    const list = await User.find({}, "userId userName userEmail")
    ctx.body = utils.success(list)
  } catch (error) {
    ctx.body = utils.fail(error.stack)
  }
})
// 获取用户对应的权限菜单
router.get("/getPermissionList", async ctx => {
  let authorization = ctx.request.headers.authorization
  let { data } = utils.decoded(authorization)
  let menuList = await getMenuList(data.role, data.roleList)
  let actionList = getActionList(JSON.parse(JSON.stringify(menuList)))
  ctx.body = utils.success({ menuList, actionList })
})
async function getMenuList(userRole, roleKeys) {
  let rootList = []
  // 该地方无动态获取权限 userRole == 1 缺陷
  if (userRole == 0 || userRole == 1) {
    // 管理员--查询所有数据
    rootList = (await Menu.find({})) || []
  } else {
    // 根据用户拥有的角色，获取权限列表
    // 先查找用户对应的角色有哪些
    let roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map(role => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList
      permissionList = permissionList.concat([
        ...checkedKeys,
        ...halfCheckedKeys,
      ])
    })
    permissionList = [...new Set(permissionList)]
    // console.log("permissionList", permissionList)
    rootList = await Menu.find({ _id: { $in: permissionList } })
  }
  return utils.getTreeMenu(rootList, null, [])
}
// 获取按钮
function getActionList(list) {
  const actionList = []
  const deep = arr => {
    while (arr.length) {
      let item = arr.pop()
      // 操作菜单是按钮
      if (item.action) {
        item.action.map(action => {
          actionList.push(action.menuCode)
        })
      }
      // 只有当有children和action不为true的时候递归
      if (item.children && !item.action) {
        deep(item.children)
      }
    }
  }
  deep(list)
  return actionList
}
module.exports = router
