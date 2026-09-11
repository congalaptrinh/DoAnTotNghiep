const prisma = require('../utils/prisma');

const includeDetail = {
  item: { select: { item_id: true, item_code: true, item_name: true, unit: true, min_stock: true, max_stock: true } },
  warehouse: { select: { warehouse_id: true, warehouse_name: true } },
  location: { select: { location_id: true, location_code: true, location_name: true } },
};

async function list(filters = {}) {
  const where = {};
  if (filters.item_id) where.item_id = filters.item_id;
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.location_id) where.location_id = filters.location_id;

  return prisma.inventory.findMany({
    where,
    include: includeDetail,
    orderBy: [{ warehouse_id: 'asc' }, { location_id: 'asc' }],
  });
}

async function getByItemId(itemId, filters = {}) {
  const where = { item_id: itemId };
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;

  return prisma.inventory.findMany({
    where,
    include: includeDetail,
    orderBy: [{ warehouse_id: 'asc' }, { location_id: 'asc' }],
  });
}

module.exports = { list, getByItemId };
