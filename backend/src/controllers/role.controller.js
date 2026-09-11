const roleService = require('../services/role.service');
const { createRoleSchema, updateRoleSchema } = require('../validators/role.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  success(res, await roleService.list());
}

async function getById(req, res) {
  success(res, await roleService.getById(req.params.id));
}

async function create(req, res) {
  const data = createRoleSchema.parse(req.body);
  success(res, await roleService.create(data), 'Tạo vai trò thành công', 201);
}

async function update(req, res) {
  const data = updateRoleSchema.parse(req.body);
  success(res, await roleService.update(req.params.id, data), 'Cập nhật vai trò thành công');
}

async function remove(req, res) {
  await roleService.remove(req.params.id);
  success(res, null, 'Xoá vai trò thành công');
}

module.exports = { list, getById, create, update, remove };
