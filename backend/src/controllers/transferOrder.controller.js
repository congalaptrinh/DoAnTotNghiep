const transferOrderService = require('../services/transferOrder.service');
const { createTransferOrderSchema } = require('../validators/transferOrder.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { from_warehouse_id, to_warehouse_id, status } = req.query;
  success(res, await transferOrderService.list({ from_warehouse_id, to_warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await transferOrderService.getById(req.params.id));
}

async function create(req, res) {
  const data = createTransferOrderSchema.parse(req.body);
  success(res, await transferOrderService.create(data, req.user.user_id), 'Tạo phiếu chuyển kho thành công', 201);
}

async function confirm(req, res) {
  success(res, await transferOrderService.confirm(req.params.id, req.user.user_id), 'Xác nhận chuyển kho thành công');
}

module.exports = { list, getById, create, confirm };
