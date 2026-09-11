const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

async function findRaw(id) {
  const category = await prisma.itemCategory.findUnique({ where: { category_id: id } });
  if (!category) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  return category;
}

async function list() {
  return prisma.itemCategory.findMany({ orderBy: { category_name: 'asc' } });
}

async function getById(id) {
  return findRaw(id);
}

async function create(data) {
  return prisma.itemCategory.create({ data });
}

async function update(id, data) {
  await findRaw(id);
  return prisma.itemCategory.update({ where: { category_id: id }, data });
}

async function remove(id) {
  await findRaw(id);
  return prisma.itemCategory.delete({ where: { category_id: id } });
}

module.exports = { list, getById, create, update, remove };
