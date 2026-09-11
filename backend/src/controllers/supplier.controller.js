const supplierService = require('../services/supplier.service');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { status, search } = req.query;
  success(res, await supplierService.list({ status, search }));
}

async function getById(req, res) {
  success(res, await supplierService.getById(req.params.id));
}

async function create(req, res) {
  const data = createSupplierSchema.parse(req.body);
  success(res, await supplierService.create(data), 'Tạo nhà cung cấp thành công', 201);
}

async function update(req, res) {
  const data = updateSupplierSchema.parse(req.body);
  success(res, await supplierService.update(req.params.id, data), 'Cập nhật nhà cung cấp thành công');
}

async function remove(req, res) {
  await supplierService.remove(req.params.id);
  success(res, null, 'Đã ngừng hợp tác với nhà cung cấp');
}

module.exports = { list, getById, create, update, remove };
