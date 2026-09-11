const ApiError = require('../utils/ApiError');

async function findInventoryRow(tx, { item_id, warehouse_id, location_id }) {
  return tx.inventory.findUnique({
    where: {
      item_id_warehouse_id_location_id: { item_id, warehouse_id, location_id },
    },
  });
}

// Cộng tồn kho tại 1 vị trí (upsert nếu chưa có dòng inventory nào tại đó).
async function incrementInventory(tx, { item_id, warehouse_id, location_id, quantity }) {
  const existing = await findInventoryRow(tx, { item_id, warehouse_id, location_id });

  if (!existing) {
    return tx.inventory.create({
      data: {
        item_id,
        warehouse_id,
        location_id,
        quantity,
        reserved_quantity: 0,
        available_quantity: quantity,
      },
    });
  }

  const newQuantity = existing.quantity + quantity;
  return tx.inventory.update({
    where: { inventory_id: existing.inventory_id },
    data: {
      quantity: newQuantity,
      available_quantity: newQuantity - existing.reserved_quantity,
    },
  });
}

// Trừ tồn kho tại 1 vị trí — throw ApiError(400) nếu available_quantity không đủ.
// Được gọi bên trong prisma.$transaction: throw ở đây làm toàn bộ transaction rollback thật,
// không phải kiểm tra giả lập rồi mới mở transaction.
async function decrementInventory(tx, { item_id, warehouse_id, location_id, quantity }) {
  const existing = await findInventoryRow(tx, { item_id, warehouse_id, location_id });
  const available = existing?.available_quantity ?? 0;

  if (available < quantity) {
    throw new ApiError(
      400,
      `Tồn kho không đủ để xuất (còn ${available}, cần ${quantity}) tại vị trí đã chọn`
    );
  }

  const newQuantity = existing.quantity - quantity;
  return tx.inventory.update({
    where: { inventory_id: existing.inventory_id },
    data: {
      quantity: newQuantity,
      available_quantity: newQuantity - existing.reserved_quantity,
    },
  });
}

// SET tuyệt đối tồn kho tại 1 vị trí (dùng cho kiểm kê — khác increment/decrement là cộng/trừ tương đối).
// Không kiểm tra available_quantity vì đây là điều chỉnh cho khớp thực tế, không phải giao dịch xuất.
async function setInventoryQuantity(tx, { item_id, warehouse_id, location_id, quantity }) {
  const existing = await findInventoryRow(tx, { item_id, warehouse_id, location_id });

  if (!existing) {
    return tx.inventory.create({
      data: {
        item_id,
        warehouse_id,
        location_id,
        quantity,
        reserved_quantity: 0,
        available_quantity: quantity,
      },
    });
  }

  return tx.inventory.update({
    where: { inventory_id: existing.inventory_id },
    data: {
      quantity,
      available_quantity: quantity - existing.reserved_quantity,
    },
  });
}

// Ghi 1 dòng lịch sử biến động kho.
async function recordMovement(tx, {
  item_id,
  warehouse_id,
  location_id,
  movement_type,
  quantity,
  reference_type,
  reference_id,
  performed_by,
  note,
}) {
  return tx.stockMovement.create({
    data: {
      item_id,
      warehouse_id,
      location_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      performed_by,
      note,
    },
  });
}

module.exports = { incrementInventory, decrementInventory, setInventoryQuantity, recordMovement };
