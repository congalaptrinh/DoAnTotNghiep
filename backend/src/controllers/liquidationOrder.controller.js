const liquidationOrderService = require('../services/liquidationOrder.service');
const { createLiquidationOrderSchema } = require('../validators/liquidationOrder.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { warehouse_id, status } = req.query;
  success(res, await liquidationOrderService.list({ warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await liquidationOrderService.getById(req.params.id));
}

async function create(req, res) {
  const data = createLiquidationOrderSchema.parse(req.body);
  success(res, await liquidationOrderService.create(data, req.user.user_id), 'Tạo phiếu thanh lý thành công', 201);
}

async function confirm(req, res) {
  success(res, await liquidationOrderService.confirm(req.params.id, req.user.user_id), 'Xác nhận thanh lý thành công');
}

module.exports = { list, getById, create, confirm };
