const exportOrderService = require('../services/exportOrder.service');
const { createExportOrderSchema } = require('../validators/exportOrder.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { warehouse_id, status } = req.query;
  success(res, await exportOrderService.list({ warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await exportOrderService.getById(req.params.id));
}

async function create(req, res) {
  const data = createExportOrderSchema.parse(req.body);
  success(res, await exportOrderService.create(data, req.user.user_id), 'Tạo phiếu xuất kho thành công', 201);
}

async function confirm(req, res) {
  success(res, await exportOrderService.confirm(req.params.id, req.user.user_id), 'Xác nhận xuất kho thành công');
}

module.exports = { list, getById, create, confirm };
