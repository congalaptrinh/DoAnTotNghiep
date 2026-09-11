const userService = require('../services/user.service');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  success(res, await userService.list());
}

async function getById(req, res) {
  success(res, await userService.getById(req.params.id));
}

async function create(req, res) {
  const data = createUserSchema.parse(req.body);
  success(res, await userService.create(data), 'Tạo người dùng thành công', 201);
}

async function update(req, res) {
  const data = updateUserSchema.parse(req.body);
  success(res, await userService.update(req.params.id, data), 'Cập nhật người dùng thành công');
}

async function remove(req, res) {
  await userService.remove(req.params.id);
  success(res, null, 'Đã khoá người dùng');
}

module.exports = { list, getById, create, update, remove };
