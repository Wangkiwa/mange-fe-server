/*
 * @Descripttion:
 * @Author: WangRunZhi
 * @Date: 2022-07-19 17:03:17
 */
const mongoose = require("mongoose")
const leaveSchema = mongoose.Schema({
  orderNo: String, //单号
  applyType: Number,
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: Date.now },
  applyUser: {
    userId: String,
    userName: String,
    UserEmail: String,
  },
  leaveTime: String,
  reasons: String,
  auditUsers: String,
  curAuditUserName: String,
  auditFlows: [
    {
      userId: String,
      userName: String,
      UserEmail: String,
    },
  ],
  auditLogs: [
    {
      userId: String,
      userName: String,
      crateTime: Date,
      remark: String,
      action: String,
    },
  ],
  applyState: { type: Number, default: 1 },
  createTime: {
    type: Date,
    default: Date.now(),
  }, //创建时间
})

module.exports = mongoose.model("leaves", leaveSchema, "leaves")
