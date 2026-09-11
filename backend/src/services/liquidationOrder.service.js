const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { generateCode } = require('../utils/codeGenerator');
const { decrementInventory, recordMovement } = require('./stockMovement.helper');

const detailInclude = {
  warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  creator: { select: { user_id: true, full_name: true, email: true } },
  approver: { select: { user_id: true, full_name: true, email: true } },
  items: { include: { item: true, location: true } },
};

async function list(filters = {}) {
  const where = {};
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.status) where.status = filters.status;

  return prisma.liquidationOrder.findMany({
    where,
    include: detailInclude,
    orderBy: { created_at: 'desc' },
  });
}

async function getById(id) {
  const order = await prisma.liquidationOrder.findUnique({
    where: { liquidation_id: id },
    include: detailInclude,
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu thanh lý');
  }
  return order;
}

async function create(data, userId) {
  const { items, ...rest } = data;
  return prisma.liquidationOrder.create({
    data: {
      ...rest,
      liquidation_code: generateCode('LIQ'),
      created_by: userId,
      status: 'DRAFT',
      items: { create: items },
    },
    include: detailInclude,
  });
}

async function confirm(id, userId) {
  const order = await prisma.liquidationOrder.findUnique({
    where: { liquidation_id: id },
    include: { items: true },
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu thanh lý');
  }
  if (order.status !== 'DRAFT') {
    throw new ApiError(400, 'Phiếu thanh lý đã được xử lý trước đó');
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
        movement_type: 'LIQUIDATION',
        quantity: line.quantity,
        reference_type: 'LIQUIDATION_ORDER',
        reference_id: order.liquidation_id,
        performed_by: userId,
        note: order.note,
      });
    }

    await tx.liquidationOrder.update({
      where: { liquidation_id: id },
      data: { status: 'CONFIRMED', approved_by: userId },
    });
  });

  return getById(id);
}

module.exports = { list, getById, create, confirm };
