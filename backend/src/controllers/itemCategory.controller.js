const itemCategoryService = require('../services/itemCategory.service');
const { createItemCategorySchema, updateItemCategorySchema } = require('../validators/itemCategory.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  success(res, await itemCategoryService.list());
}

async function getById(req, res) {
  success(res, await itemCategoryService.getById(req.params.id));
}

async function create(req, res) {
  const data = createItemCategorySchema.parse(req.body);
  success(res, await itemCategoryService.create(data), 'Tạo danh mục thành công', 201);
}

async function update(req, res) {
  const data = updateItemCategorySchema.parse(req.body);
  success(res, await itemCategoryService.update(req.params.id, data), 'Cập nhật danh mục thành công');
}

async function remove(req, res) {
  await itemCategoryService.remove(req.params.id);
  success(res, null, 'Xoá danh mục thành công');
}

module.exports = { list, getById, create, update, remove };
