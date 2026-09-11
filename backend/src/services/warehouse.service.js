const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

async function findRaw(id) {
  const warehouse = await prisma.warehouse.findUnique({ where: { warehouse_id: id } });
  if (!warehouse) {
    throw new ApiError(404, 'Không tìm thấy kho');
  }
  return warehouse;
}

async function list() {
  return prisma.warehouse.findMany({
    include: { manager: { select: { user_id: true, full_name: true, email: true } } },
    orderBy: { warehouse_name: 'asc' },
  });
}

async function getById(id) {
  await findRaw(id);
  return prisma.warehouse.findUnique({
    where: { warehouse_id: id },
    include: { manager: { select: { user_id: true, full_name: true, email: true } } },
  });
}

async function create(data) {
  return prisma.warehouse.create({ data });
}

async function update(id, data) {
  await findRaw(id);
  return prisma.warehouse.update({ where: { warehouse_id: id }, data });
}

async function remove(id) {
  await findRaw(id);
  return prisma.warehouse.update({ where: { warehouse_id: id }, data: { status: 'INACTIVE' } });
}

module.exports = { list, getById, create, update, remove };
