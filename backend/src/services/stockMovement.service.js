const prisma = require('../utils/prisma');

async function list(filters = {}) {
  const where = {};
  if (filters.item_id) where.item_id = filters.item_id;
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.location_id) where.location_id = filters.location_id;
  if (filters.movement_type) where.movement_type = filters.movement_type;
  if (filters.reference_type) where.reference_type = filters.reference_type;
  if (filters.from || filters.to) {
    where.movement_date = {};
    if (filters.from) where.movement_date.gte = new Date(filters.from);
    if (filters.to) where.movement_date.lte = new Date(filters.to);
  }

  return prisma.stockMovement.findMany({
    where,
    include: {
      item: { select: { item_id: true, item_code: true, item_name: true, unit: true } },
      warehouse: { select: { warehouse_id: true, warehouse_name: true } },
      location: { select: { location_id: true, location_code: true } },
      performer: { select: { user_id: true, full_name: true, email: true } },
    },
    orderBy: { movement_date: 'asc' },
  });
}

module.exports = { list };
