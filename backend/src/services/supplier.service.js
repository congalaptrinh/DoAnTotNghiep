const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

async function findRaw(id) {
  const supplier = await prisma.supplier.findUnique({ where: { supplier_id: id } });
  if (!supplier) {
    throw new ApiError(404, 'Không tìm thấy nhà cung cấp');
  }
  return supplier;
}

async function list(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.supplier_name = { contains: filters.search, mode: 'insensitive' };
  }
  return prisma.supplier.findMany({ where, orderBy: { supplier_name: 'asc' } });
}

async function getById(id) {
  return findRaw(id);
}

async function create(data) {
  return prisma.supplier.create({ data });
}

async function update(id, data) {
  await findRaw(id);
  return prisma.supplier.update({ where: { supplier_id: id }, data });
}

async function remove(id) {
  await findRaw(id);
  return prisma.supplier.update({ where: { supplier_id: id }, data: { status: 'INACTIVE' } });
}

module.exports = { list, getById, create, update, remove };
