const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

async function list() {
  return prisma.role.findMany({ orderBy: { role_name: 'asc' } });
}

async function getById(id) {
  const role = await prisma.role.findUnique({ where: { role_id: id } });
  if (!role) {
    throw new ApiError(404, 'Không tìm thấy vai trò');
  }
  return role;
}

async function create(data) {
  return prisma.role.create({ data });
}

async function update(id, data) {
  await getById(id);
  return prisma.role.update({ where: { role_id: id }, data });
}

async function remove(id) {
  await getById(id);
  return prisma.role.delete({ where: { role_id: id } });
}

module.exports = { list, getById, create, update, remove };
