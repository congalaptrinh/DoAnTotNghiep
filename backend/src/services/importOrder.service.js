const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { generateCode } = require('../utils/codeGenerator');
const { incrementInventory, recordMovement } = require('./stockMovement.helper');

const detailInclude = {
  supplier: true,
  warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  creator: { select: { user_id: true, full_name: true, email: true } },
  items: { include: { item: true, location: true } },
};

async function list(filters = {}) {
  const where = {};
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.status) where.status = filters.status;

  return prisma.importOrder.findMany({
    where,
    include: detailInclude,
    orderBy: { created_at: 'desc' },
  });
}

async function getById(id) {
  const order = await prisma.importOrder.findUnique({
    where: { import_id: id },
    include: detailInclude,
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu nhập kho');
  }
  return order;
}

async function create(data, userId) {
  const { items, ...rest } = data;
  return prisma.importOrder.create({
    data: {
      ...rest,
      import_code: generateCode('IMP'),
      created_by: userId,
      status: 'DRAFT',
      items: { create: items },
    },
    include: detailInclude,
  });
}

async function confirm(id, userId) {
  const order = await prisma.importOrder.findUnique({
    where: { import_id: id },
    include: { items: true },
  });
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy phiếu nhập kho');
  }
  if (order.status !== 'DRAFT') {
    throw new ApiError(400, 'Phiếu nhập kho đã được xử lý trước đó');
  }

  await prisma.$transaction(async (tx) => {
    for (const line of order.items) {
      await incrementInventory(tx, {
        item_id: line.item_id,
        warehouse_id: order.warehouse_id,
        location_id: line.location_id,
        quantity: line.quantity,
      });
      await recordMovement(tx, {
        item_id: line.item_id,
        warehouse_id: order.warehouse_id,
        location_id: line.location_id,
        movement_type: 'IMPORT',
        quantity: line.quantity,
        reference_type: 'IMPORT_ORDER',
        reference_id: order.import_id,
        performed_by: userId,
        note: order.note,
      });
    }

    await tx.importOrder.update({
      where: { import_id: id },
      data: { status: 'CONFIRMED' },
    });
  });

  return getById(id);
}

// Dùng cho luồng nhập kho bằng AI (F2, specs/06-BUILD-CHECKLIST.md): nhận dữ liệu đã được
// người dùng xác nhận/chỉnh sửa trên UI (sau bước gọi /api/ai/detect), tạo phiếu nhập VÀ
// xác nhận NGAY trong CÙNG 1 transaction — không tách 2 bước tạo/confirm như flow thường,
// vì người dùng đã tự "duyệt" kết quả AI trước khi gọi API này rồi (xem 07-DECISIONS-LOG.md).
async function createFromAi(data, userId) {
  const { items, ...rest } = data;

  const importId = await prisma.$transaction(async (tx) => {
    const order = await tx.importOrder.create({
      data: {
        ...rest,
        import_code: generateCode('IMP'),
        created_by: userId,
        status: 'DRAFT',
        items: { create: items },
      },
      include: { items: true },
    });

    for (const line of order.items) {
      await incrementInventory(tx, {
        item_id: line.item_id,
        warehouse_id: order.warehouse_id,
        location_id: line.location_id,
        quantity: line.quantity,
      });
      await recordMovement(tx, {
        item_id: line.item_id,
        warehouse_id: order.warehouse_id,
        location_id: line.location_id,
        movement_type: 'IMPORT',
        quantity: line.quantity,
        reference_type: 'IMPORT_ORDER',
        reference_id: order.import_id,
        performed_by: userId,
        note: order.note,
      });
    }

    await tx.importOrder.update({
      where: { import_id: order.import_id },
      data: { status: 'CONFIRMED' },
    });

    return order.import_id;
  });

  return getById(importId);
}

module.exports = { list, getById, create, confirm, createFromAi };
