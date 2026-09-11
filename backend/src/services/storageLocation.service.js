const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

async function findRaw(id) {
  const location = await prisma.storageLocation.findUnique({ where: { location_id: id } });
  if (!location) {
    throw new ApiError(404, 'Không tìm thấy vị trí lưu trữ');
  }
  return location;
}

async function list(filters = {}) {
  const where = {};
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.status) where.status = filters.status;
  return prisma.storageLocation.findMany({
    where,
    include: { warehouse: { select: { warehouse_id: true, warehouse_name: true } } },
    orderBy: { location_code: 'asc' },
  });
}

async function getById(id) {
  await findRaw(id);
  return prisma.storageLocation.findUnique({
    where: { location_id: id },
    include: { warehouse: { select: { warehouse_id: true, warehouse_name: true } } },
  });
}

async function create(data) {
  return prisma.storageLocation.create({ data });
}

async function update(id, data) {
  await findRaw(id);
  return prisma.storageLocation.update({ where: { location_id: id }, data });
}

async function remove(id) {
  await findRaw(id);
  return prisma.storageLocation.update({ where: { location_id: id }, data: { status: 'INACTIVE' } });
}

module.exports = { list, getById, create, update, remove };
