const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { generateCode } = require('../utils/codeGenerator');
const { decrementInventory, recordMovement } = require('./stockMovement.helper');

const detailInclude = {
  warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  requester: { select: { user_id: true, full_name: true, email: true } },
  approver: { select: { user_id: true, full_name: true, email: true } },
  items: { include: { item: true, location: true } },
};

async function list(filters = {}) {
  const where = {};
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.status) where.status = filters.status;

  return prisma.exportOrder.findMany({
    where,
    include: detailInclude,
    orderBy: { created_at: 'desc' },
  });
}

async function getById(id) {
  const order = await prisma.exportOrder.findUnique({
    where: { export_id: id },
    include: detailInclude,
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu xuất kho');
  }
  return order;
}

async function create(data, userId) {
  const { items, ...rest } = data;
  return prisma.exportOrder.create({
    data: {
      ...rest,
      export_code: generateCode('EXP'),
      requested_by: userId,
      status: 'DRAFT',
      items: { create: items },
    },
    include: detailInclude,
  });
}

async function confirm(id, userId) {
  const order = await prisma.exportOrder.findUnique({
    where: { export_id: id },
    include: { items: true },
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu xuất kho');
  }
  if (order.status !== 'DRAFT') {
    throw new ApiError(400, 'Phiếu xuất kho đã được xử lý trước đó');
  }

  await prisma.$transaction(async (tx) => {
    for (const line of order.items) {
      await decrementInventory(tx, {
        item_id: line.item_id,
        warehouse_id: order.warehouse_id,
        location_id: line.location_id,
        quantity: line.quantity,
      });
      await recordMovement(tx, {
        item_id: line.item_id,
        warehouse_id: order.warehouse_id,
        location_id: line.location_id,
        movement_type: 'EXPORT',
        quantity: line.quantity,
        reference_type: 'EXPORT_ORDER',
        reference_id: order.export_id,
        performed_by: userId,
        note: order.note,
      });
    }

    await tx.exportOrder.update({
      where: { export_id: id },
      data: { status: 'CONFIRMED', approved_by: userId },
    });
  });

  return getById(id);
}

module.exports = { list, getById, create, confirm };
