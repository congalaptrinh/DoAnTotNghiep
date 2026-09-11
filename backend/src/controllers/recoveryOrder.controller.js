const recoveryOrderService = require('../services/recoveryOrder.service');
const { createRecoveryOrderSchema } = require('../validators/recoveryOrder.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { warehouse_id, status } = req.query;
  success(res, await recoveryOrderService.list({ warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await recoveryOrderService.getById(req.params.id));
}

async function create(req, res) {
  const data = createRecoveryOrderSchema.parse(req.body);
  success(res, await recoveryOrderService.create(data, req.user.user_id), 'Tạo phiếu thu hồi thành công', 201);
}

async function confirm(req, res) {
  success(res, await recoveryOrderService.confirm(req.params.id, req.user.user_id), 'Xác nhận thu hồi thành công');
}

module.exports = { list, getById, create, confirm };
