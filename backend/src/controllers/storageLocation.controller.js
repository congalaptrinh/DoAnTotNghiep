const storageLocationService = require('../services/storageLocation.service');
const {
  createStorageLocationSchema,
  updateStorageLocationSchema,
} = require('../validators/storageLocation.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { warehouse_id, status } = req.query;
  success(res, await storageLocationService.list({ warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await storageLocationService.getById(req.params.id));
}

async function create(req, res) {
  const data = createStorageLocationSchema.parse(req.body);
  success(res, await storageLocationService.create(data), 'Tạo vị trí lưu trữ thành công', 201);
}

async function update(req, res) {
  const data = updateStorageLocationSchema.parse(req.body);
  success(res, await storageLocationService.update(req.params.id, data), 'Cập nhật vị trí lưu trữ thành công');
}

async function remove(req, res) {
  await storageLocationService.remove(req.params.id);
  success(res, null, 'Đã ngừng sử dụng vị trí lưu trữ');
}

module.exports = { list, getById, create, update, remove };
