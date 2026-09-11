const importOrderService = require('../services/importOrder.service');
const { createImportOrderSchema } = require('../validators/importOrder.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { warehouse_id, status } = req.query;
  success(res, await importOrderService.list({ warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await importOrderService.getById(req.params.id));
}

async function create(req, res) {
  const data = createImportOrderSchema.parse(req.body);
  success(res, await importOrderService.create(data, req.user.user_id), 'Tạo phiếu nhập kho thành công', 201);
}

async function confirm(req, res) {
  success(res, await importOrderService.confirm(req.params.id, req.user.user_id), 'Xác nhận nhập kho thành công');
}

async function createFromAi(req, res) {
  const data = createImportOrderSchema.parse(req.body);
  success(res, await importOrderService.createFromAi(data, req.user.user_id), 'Tạo phiếu nhập kho từ AI thành công', 201);
}

module.exports = { list, getById, create, confirm, createFromAi };
