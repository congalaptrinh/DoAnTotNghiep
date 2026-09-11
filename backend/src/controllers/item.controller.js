const itemService = require('../services/item.service');
const { createItemSchema, updateItemSchema } = require('../validators/item.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { category_id, status, search } = req.query;
  success(res, await itemService.list({ category_id, status, search }));
}

async function getById(req, res) {
  success(res, await itemService.getById(req.params.id));
}

async function create(req, res) {
  const data = createItemSchema.parse(req.body);
  success(res, await itemService.create(data), 'Tạo vật tư thành công', 201);
}

async function update(req, res) {
  const data = updateItemSchema.parse(req.body);
  success(res, await itemService.update(req.params.id, data), 'Cập nhật vật tư thành công');
}

async function remove(req, res) {
  await itemService.remove(req.params.id);
  success(res, null, 'Đã ngừng sử dụng vật tư');
}

module.exports = { list, getById, create, update, remove };
