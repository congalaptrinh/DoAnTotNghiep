const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { generateCode } = require('../utils/codeGenerator');
const { setInventoryQuantity, recordMovement } = require('./stockMovement.helper');

const detailInclude = {
  warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  creator: { select: { user_id: true, full_name: true, email: true } },
  items: { include: { item: true, location: true } },
};

async function list(filters = {}) {
  const where = {};
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.status) where.status = filters.status;

  return prisma.stocktakeSession.findMany({
    where,
    include: detailInclude,
    orderBy: { created_at: 'desc' },
  });
}

async function getById(id) {
  const session = await prisma.stocktakeSession.findUnique({
    where: { stocktake_id: id },
    include: detailInclude,
  });
  if (!session) {
    throw new ApiError(404, 'Không tìm thấy phiên kiểm kê');
  }
  return session;
}

// Snapshot toàn bộ dòng inventory hiện có của kho tại đúng thời điểm tạo phiên.
async function create(data, userId) {
  const inventoryRows = await prisma.inventory.findMany({
    where: { warehouse_id: data.warehouse_id },
  });

  return prisma.stocktakeSession.create({
    data: {
      warehouse_id: data.warehouse_id,
      stocktake_date: data.stocktake_date,
      note: data.note,
      created_by: userId,
      stocktake_code: generateCode('STK'),
      status: 'DRAFT',
      items: {
        create: inventoryRows.map((inv) => ({
          item_id: inv.item_id,
          location_id: inv.location_id,
          system_quantity: inv.quantity,
        })),
      },
    },
    include: detailInclude,
  });
}

// Nhân viên/quản lý nhập số lượng thực tế cho từng dòng — có thể gọi nhiều lần trước khi confirm.
async function updateItems(id, itemUpdates) {
  const session = await prisma.stocktakeSession.findUnique({
    where: { stocktake_id: id },
    include: { items: true },
  });
  if (!session) {
    throw new ApiError(404, 'Không tìm thấy phiên kiểm kê');
  }
  if (session.status !== 'DRAFT') {
    throw new ApiError(400, 'Phiên kiểm kê đã được xử lý trước đó');
  }

  const sessionItemMap = new Map(session.items.map((i) => [i.stocktake_item_id, i]));
  for (const update of itemUpdates) {
    if (!sessionItemMap.has(update.stocktake_item_id)) {
      throw new ApiError(400, `Dòng kiểm kê ${update.stocktake_item_id} không thuộc phiên này`);
    }
  }

  await Promise.all(
    itemUpdates.map((update) => {
      const line = sessionItemMap.get(update.stocktake_item_id);
      return prisma.stocktakeSessionItem.update({
        where: { stocktake_item_id: update.stocktake_item_id },
        data: {
          actual_quantity: update.actual_quantity,
          difference: update.actual_quantity - line.system_quantity,
        },
      });
    })
  );

  return getById(id);
}

async function confirm(id, userId) {
  const session = await prisma.stocktakeSession.findUnique({
    where: { stocktake_id: id },
    include: { items: true },
  });
  if (!session) {
    throw new ApiError(404, 'Không tìm thấy phiên kiểm kê');
  }
  if (session.status !== 'DRAFT') {
    throw new ApiError(400, 'Phiên kiểm kê đã được xử lý trước đó');
  }

  const notFilled = session.items.filter((i) => i.actual_quantity === null);
  if (notFilled.length > 0) {
    throw new ApiError(400, `Còn ${notFilled.length} dòng chưa nhập số lượng thực tế, không thể xác nhận`);
  }

  await prisma.$transaction(async (tx) => {
    for (const line of session.items) {
      if (line.difference !== 0) {
        await setInventoryQuantity(tx, {
          item_id: line.item_id,
          warehouse_id: session.warehouse_id,
          location_id: line.location_id,
          quantity: line.actual_quantity,
        });
        await recordMovement(tx, {
          item_id: line.item_id,
          warehouse_id: session.warehouse_id,
          location_id: line.location_id,
          movement_type: 'ADJUSTMENT_STOCKTAKE',
          quantity: line.difference,
          reference_type: 'STOCKTAKE_SESSION',
          reference_id: session.stocktake_id,
          performed_by: userId,
          note: session.note,
        });
      }
    }

    await tx.stocktakeSession.update({
      where: { stocktake_id: id },
      data: { status: 'CONFIRMED' },
    });
  });

  return getById(id);
}

module.exports = { list, getById, create, updateItems, confirm };
