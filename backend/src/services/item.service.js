const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

async function findRaw(id) {
  const item = await prisma.item.findUnique({ where: { item_id: id } });
  if (!item) {
    throw new ApiError(404, 'Không tìm thấy vật tư');
  }
  return item;
}

async function list(filters = {}) {
  const where = {};
  if (filters.category_id) where.category_id = filters.category_id;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { item_code: { contains: filters.search, mode: 'insensitive' } },
      { item_name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.item.findMany({
    where,
    include: { category: true },
    orderBy: { created_at: 'desc' },
  });
}

async function getById(id) {
  await findRaw(id);
  return prisma.item.findUnique({ where: { item_id: id }, include: { category: true } });
}

async function create(data) {
  return prisma.item.create({ data, include: { category: true } });
}

async function update(id, data) {
  await findRaw(id);
  return prisma.item.update({ where: { item_id: id }, data, include: { category: true } });
}

async function remove(id) {
  await findRaw(id);
  return prisma.item.update({ where: { item_id: id }, data: { status: 'INACTIVE' }, include: { category: true } });
}

module.exports = { list, getById, create, update, remove };
