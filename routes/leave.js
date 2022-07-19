/*
 * @Descripttion:申假路由
 * @Author: TaoWang
 * @Date: 2022-07-19 17:12:41
 */
const router = require("koa-router")()
const utils = require("../utils/utils")
const Leave = require("../models/leaveSchema")
const Dept = require("../models/deptSchema")
router.prefix("/leave")
// 查询申请列表
router.get("/list", async ctx => {
  const { applyState } = ctx.request.query
  let authorization = ctx.request.headers.authorization
  let { data } = utils.decoded(authorization) //解密token
  const { page, skipIndex } = utils.pager(ctx.request.query)
  try {
    let params = {
      "applyUser.userId": data.userId,
    }
    if (applyState) params.applyState = applyState
    const query = Leave.find(params) //根据用户Id找到和自己相关的所有数据
    const list = await query.skip(skipIndex).limit(page.pageSize) //根据页码查询数据
    const total = await Leave.countDocuments(params)
    ctx.body = utils.success({
      page: {
        ...page,
        total,
      },
      list,
    })
  } catch (error) {
    ctx.body = utils.fail(`查询失败:${error.stack}`)
  }
})
//申请的创建/编辑/删除
router.post("/operate", async ctx => {
  const { _id, action, ...params } = ctx.request.body
  let authorization = ctx.request.headers.authorization
  let { data } = utils.decoded(authorization) //解密token
  if (action == "create") {
    // 生成单号
    let orderNo = "XJ"
    const total = await Leave.countDocuments()
    orderNo += utils.formateDate(new Date(), "yyyyMMdd") //格式化成年月日时分秒拼接申请单号
    params.orderNo = orderNo + total //XJ202208081
    // 根据用户获取部门id
    let id = data.deptId.pop()
    //  查找负责人信息
    let dept = await Dept.findById(id)
    // 获取人事部和财务部负责人信息
    let userList = await Dept.find({
      deptName: { $in: ["人事部门", "财务部门"] },
    })
    let auditUsers = dept.userName // 完整审批人
    let curAuditUserName = dept.userName // 当前审批人
    // 审批流
    let auditFlows = [
      {
        userId: dept.userId,
        userName: dept.userName,
        userEmail: dept.userEmail,
      },
    ]
    userList.map(item => {
      auditFlows.push({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
      })
      auditUsers += "," + item.userName
    })
    params.auditUsers = auditUsers
    params.curAuditUserName = curAuditUserName
    params.auditFlows = auditFlows
    params.auditLogs = [] // 审批完放入
    params.applyUser = {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
    }
    let res = await Leave.create(params)
    ctx.body = utils.success("", "创建成功")
  } else {
    let res = await Leave.findByIdAndUpdate(_id, { applyState: 5 })
    ctx.body = utils.success("", "操作成功")
  }
})
module.exports = router
