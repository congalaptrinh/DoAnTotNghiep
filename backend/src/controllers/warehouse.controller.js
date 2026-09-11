const warehouseService = require('../services/warehouse.service');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validators/warehouse.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  success(res, await warehouseService.list());
}

async function getById(req, res) {
  success(res, await warehouseService.getById(req.params.id));
}

async function create(req, res) {
  const data = createWarehouseSchema.parse(req.body);
  success(res, await warehouseService.create(data), 'Tạo kho thành công', 201);
}

async function update(req, res) {
  const data = updateWarehouseSchema.parse(req.body);
  success(res, await warehouseService.update(req.params.id, data), 'Cập nhật kho thành công');
}

async function remove(req, res) {
  await warehouseService.remove(req.params.id);
  success(res, null, 'Đã ngừng sử dụng kho');
}

module.exports = { list, getById, create, update, remove };
