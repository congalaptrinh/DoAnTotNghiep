const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { generateCode } = require('../utils/codeGenerator');
const { incrementInventory, decrementInventory, recordMovement } = require('./stockMovement.helper');

const detailInclude = {
  from_warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  to_warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  creator: { select: { user_id: true, full_name: true, email: true } },
  items: { include: { item: true, from_location: true, to_location: true } },
};

async function list(filters = {}) {
  const where = {};
  if (filters.from_warehouse_id) where.from_warehouse_id = filters.from_warehouse_id;
  if (filters.to_warehouse_id) where.to_warehouse_id = filters.to_warehouse_id;
  if (filters.status) where.status = filters.status;

  return prisma.transferOrder.findMany({
    where,
    include: detailInclude,
    orderBy: { created_at: 'desc' },
  });
}

async function getById(id) {
  const order = await prisma.transferOrder.findUnique({
    where: { transfer_id: id },
    include: detailInclude,
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu chuyển kho');
  }
  return order;
}

async function create(data, userId) {
  const { items, ...rest } = data;
  return prisma.transferOrder.create({
    data: {
      ...rest,
      transfer_code: generateCode('TRF'),
      created_by: userId,
      status: 'DRAFT',
      items: { create: items },
    },
    include: detailInclude,
  });
}

async function confirm(id, userId) {
  const order = await prisma.transferOrder.findUnique({
    where: { transfer_id: id },
    include: { items: true },
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu chuyển kho');
  }
  if (order.status !== 'DRAFT') {
    throw new ApiError(400, 'Phiếu chuyển kho đã được xử lý trước đó');
  }

  await prisma.$transaction(async (tx) => {
    for (const line of order.items) {
      await decrementInventory(tx, {
        item_id: line.item_id,
        warehouse_id: order.from_warehouse_id,
        location_id: line.from_location_id,
        quantity: line.quantity,
      });
      await incrementInventory(tx, {
        item_id: line.item_id,
        warehouse_id: order.to_warehouse_id,
        location_id: line.to_location_id,
        quantity: line.quantity,
      });
      await recordMovement(tx, {
        item_id: line.item_id,
        warehouse_id: order.from_warehouse_id,
        location_id: line.from_location_id,
        movement_type: 'TRANSFER_OUT',
        quantity: line.quantity,
        reference_type: 'TRANSFER_ORDER',
        reference_id: order.transfer_id,
        performed_by: userId,
        note: order.note,
      });
      await recordMovement(tx, {
        item_id: line.item_id,
        warehouse_id: order.to_warehouse_id,
        location_id: line.to_location_id,
        movement_type: 'TRANSFER_IN',
        quantity: line.quantity,
        reference_type: 'TRANSFER_ORDER',
        reference_id: order.transfer_id,
        performed_by: userId,
        note: order.note,
      });
    }

    await tx.transferOrder.update({
      where: { transfer_id: id },
      data: { status: 'CONFIRMED' },
    });
  });

  return getById(id);
}

module.exports = { list, getById, create, confirm };
