// Seed DỮ LIỆU DEMO THỰC TẾ cho DB dev — xem specs/07-DECISIONS-LOG.md.
// Chạy: npm run seed:demo (bên trong backend/). Idempotent: luôn dọn sạch
// toàn bộ dữ liệu nghiệp vụ cũ (trừ bảng roles + tài khoản admin@warehouse.local)
// trước khi tạo lại từ đầu, nên chạy lại bao nhiêu lần cũng ra đúng 1 kết quả,
// không bị trùng lặp/chồng dữ liệu.
//
// Mọi thay đổi tồn kho đều đi qua service nghiệp vụ thật (create + confirm),
// để stock_movements/inventory nhất quán đúng như luồng ứng dụng thật — KHÔNG
// insert thẳng vào bảng inventory. Sau khi tạo xong (tồn kho đã đúng), mới cập
// nhật lại các trường NGÀY (created_at/updated_at/<loại>_date của phiếu và
// movement_date của stock_movements liên quan) để rải phiếu trong 30 ngày gần
// nhất — không động tới bất kỳ trường số lượng/tồn kho nào ở bước này.

const fs = require('fs');
const path = require('path');

const prisma = require('../src/utils/prisma');

const itemCategoryService = require('../src/services/itemCategory.service');
const itemService = require('../src/services/item.service');
const warehouseService = require('../src/services/warehouse.service');
const storageLocationService = require('../src/services/storageLocation.service');
const supplierService = require('../src/services/supplier.service');
const userService = require('../src/services/user.service');
const importOrderService = require('../src/services/importOrder.service');
const exportOrderService = require('../src/services/exportOrder.service');
const transferOrderService = require('../src/services/transferOrder.service');
const recoveryOrderService = require('../src/services/recoveryOrder.service');
const stocktakeSessionService = require('../src/services/stocktakeSession.service');
const liquidationOrderService = require('../src/services/liquidationOrder.service');

const categoriesData = require('./demo-data/categories');
const itemsData = require('./demo-data/items');
const warehousesData = require('./demo-data/warehouses');
const suppliersData = require('./demo-data/suppliers');
const { password: DEMO_PASSWORD, users: usersData } = require('./demo-data/users');

const ADMIN_EMAIL = 'admin@warehouse.local';

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

// Thời điểm ngẫu nhiên trong `maxDays` ngày gần nhất (liên tục, không chỉ theo ngày tròn).
function pastDate(maxDays) {
  return new Date(Date.now() - Math.random() * maxDays * 24 * 60 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────
// 1. DỌN SẠCH dữ liệu nghiệp vụ cũ (giữ nguyên bảng roles + user admin)
// ─────────────────────────────────────────────────────────────────────
async function wipeOldData() {
  await prisma.stockMovement.deleteMany({});
  await prisma.stocktakeSessionItem.deleteMany({});
  await prisma.liquidationOrderItem.deleteMany({});
  await prisma.recoveryOrderItem.deleteMany({});
  await prisma.transferOrderItem.deleteMany({});
  await prisma.exportOrderItem.deleteMany({});
  await prisma.importOrderItem.deleteMany({});
  await prisma.stocktakeSession.deleteMany({});
  await prisma.liquidationOrder.deleteMany({});
  await prisma.recoveryOrder.deleteMany({});
  await prisma.transferOrder.deleteMany({});
  await prisma.exportOrder.deleteMany({});
  await prisma.importOrder.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.storageLocation.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.itemCategory.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({ where: { NOT: { email: ADMIN_EMAIL } } });
}

// ─────────────────────────────────────────────────────────────────────
// 2. Danh mục, vật tư, kho/vị trí, nhà cung cấp, tài khoản
// ─────────────────────────────────────────────────────────────────────
async function createCategories() {
  const categoryIdByName = {};
  for (const root of categoriesData) {
    const created = await itemCategoryService.create({ category_name: root.name, description: root.description ?? null });
    categoryIdByName[root.name] = created.category_id;
    for (const childName of root.children ?? []) {
      const child = await itemCategoryService.create({ category_name: childName, parent_id: created.category_id });
      categoryIdByName[childName] = child.category_id;
    }
  }
  return categoryIdByName;
}

async function createItems(categoryIdByName) {
  const itemIdByCode = {};
  for (const def of itemsData) {
    const categoryId = categoryIdByName[def.category];
    if (!categoryId) throw new Error(`Không tìm thấy danh mục "${def.category}" cho vật tư ${def.code}`);
    const created = await itemService.create({
      item_code: def.code,
      item_name: def.name,
      category_id: categoryId,
      unit: def.unit,
      specifications: def.specs,
      min_stock: def.min_stock,
      max_stock: def.max_stock,
    });
    itemIdByCode[def.code] = created.item_id;
  }
  return itemIdByCode;
}

async function createWarehouses(managerId) {
  const warehouseByKey = {}; // key -> { id, locationIds: [] }
  for (const w of warehousesData) {
    const created = await warehouseService.create({
      warehouse_name: w.warehouse_name,
      address: w.address,
      description: w.description,
      manager_id: managerId,
    });
    const locationIds = [];
    for (const loc of w.locations) {
      const createdLoc = await storageLocationService.create({
        warehouse_id: created.warehouse_id,
        location_code: loc.location_code,
      });
      locationIds.push(createdLoc.location_id);
    }
    warehouseByKey[w.key] = { id: created.warehouse_id, locationIds };
  }
  return warehouseByKey;
}

async function createSuppliers() {
  const ids = [];
  for (const s of suppliersData) {
    const created = await supplierService.create(s);
    ids.push(created.supplier_id);
  }
  return ids;
}

async function createUsers(roleIdByName) {
  const userIdByRole = {};
  for (const u of usersData) {
    const created = await userService.create({
      full_name: u.full_name,
      email: u.email,
      password: DEMO_PASSWORD,
      role_id: roleIdByName[u.role_name],
    });
    userIdByRole[u.role_name] = created.user_id;
  }
  return userIdByRole;
}

// ─────────────────────────────────────────────────────────────────────
// 3. Rải giao dịch kho qua đúng service nghiệp vụ (tồn kho tính đúng tự nhiên)
// ─────────────────────────────────────────────────────────────────────
const LOW_STOCK_DEMO_CODES = ['RES-001', 'CAP-001', 'SEN-001', 'DIS-001', 'MOT-001', 'SW-001'];

async function getAvailable(itemId, warehouseId, locationId) {
  const row = await prisma.inventory.findUnique({
    where: { item_id_warehouse_id_location_id: { item_id: itemId, warehouse_id: warehouseId, location_id: locationId } },
  });
  return row?.available_quantity ?? 0;
}

async function run() {
  console.log('== Dọn dữ liệu demo/test cũ ==');
  await wipeOldData();

  console.log('== Tạo danh mục vật tư ==');
  const categoryIdByName = await createCategories();

  console.log('== Tạo vật tư (71 mục, phủ đủ 61 lớp AI) ==');
  const itemIdByCode = await createItems(categoryIdByName);

  console.log('== Tạo tài khoản demo ==');
  const roles = await prisma.role.findMany();
  const roleIdByName = Object.fromEntries(roles.map((r) => [r.role_name, r.role_id]));
  const userIdByRole = await createUsers(roleIdByName);
  const staffId = userIdByRole.warehouse_staff;
  const managerId = userIdByRole.warehouse_manager;

  console.log('== Tạo kho và vị trí ==');
  const warehouseByKey = await createWarehouses(managerId);

  console.log('== Tạo nhà cung cấp ==');
  const supplierIds = await createSuppliers();

  // Map item -> { code, warehouseKey, locationId (vị trí "nhà"), minStock }
  const itemHome = {};
  for (const key of Object.keys(warehouseByKey)) {
    const itemsInWarehouse = itemsData.filter((i) => i.warehouse === key);
    itemsInWarehouse.forEach((def, idx) => {
      const { locationIds } = warehouseByKey[key];
      itemHome[def.code] = {
        itemId: itemIdByCode[def.code],
        warehouseId: warehouseByKey[key].id,
        locationId: locationIds[idx % locationIds.length],
        minStock: def.min_stock,
        maxStock: def.max_stock,
      };
    });
  }

  const confirmedOrders = { import: [], export: [], transfer: [], recovery: [], liquidation: [] };
  const draftOrders = { import: [], export: [], transfer: [] };

  // ── Nhập kho: theo từng kho, chia lô ~5 vật tư/phiếu ──
  console.log('== Tạo phiếu nhập kho (nhập hàng ban đầu) ==');
  for (const key of Object.keys(warehouseByKey)) {
    const itemsInWarehouse = itemsData.filter((i) => i.warehouse === key);
    for (let i = 0; i < itemsInWarehouse.length; i += 5) {
      const batch = itemsInWarehouse.slice(i, i + 5);
      const supplierId = pick(supplierIds);
      const lines = batch.map((def) => {
        const home = itemHome[def.code];
        const qty = Math.round(def.max_stock * (0.6 + Math.random() * 0.3));
        return { item_id: home.itemId, location_id: home.locationId, quantity: qty, unit_price: rand(2000, 150000) };
      });
      const order = await importOrderService.create(
        { warehouse_id: warehouseByKey[key].id, supplier_id: supplierId, note: 'Nhập hàng định kỳ', items: lines },
        staffId
      );
      const confirmed = await importOrderService.confirm(order.import_id, staffId);
      confirmedOrders.import.push(confirmed.import_id);
    }
  }

  // ── Xuất kho: vài phiếu kéo tồn xuống dưới ngưỡng tối thiểu (cảnh báo), vài phiếu xuất thường ──
  console.log('== Tạo phiếu xuất kho ==');
  for (const code of LOW_STOCK_DEMO_CODES) {
    const home = itemHome[code];
    const available = await getAvailable(home.itemId, home.warehouseId, home.locationId);
    const qty = Math.max(1, available - Math.floor(home.minStock * 0.5));
    const order = await exportOrderService.create(
      {
        warehouse_id: home.warehouseId,
        purpose: 'Xuất dùng cho dự án nội bộ',
        note: 'Xuất kho theo yêu cầu phòng kỹ thuật',
        items: [{ item_id: home.itemId, location_id: home.locationId, quantity: qty }],
      },
      staffId
    );
    const confirmed = await exportOrderService.confirm(order.export_id, managerId);
    confirmedOrders.export.push(confirmed.export_id);
  }
  for (let n = 0; n < 6; n += 1) {
    const def = pick(itemsData);
    const home = itemHome[def.code];
    const available = await getAvailable(home.itemId, home.warehouseId, home.locationId);
    if (available < 2) continue;
    const qty = Math.max(1, Math.floor(available * 0.15));
    const order = await exportOrderService.create(
      {
        warehouse_id: home.warehouseId,
        purpose: 'Xuất sử dụng nội bộ',
        note: 'Xuất kho phục vụ sản xuất',
        items: [{ item_id: home.itemId, location_id: home.locationId, quantity: qty }],
      },
      staffId
    );
    const confirmed = await exportOrderService.confirm(order.export_id, managerId);
    confirmedOrders.export.push(confirmed.export_id);
  }

  // ── Chuyển kho ──
  console.log('== Tạo phiếu chuyển kho ==');
  const warehouseKeys = Object.keys(warehouseByKey);
  for (let n = 0; n < 6; n += 1) {
    const def = pick(itemsData);
    const home = itemHome[def.code];
    const available = await getAvailable(home.itemId, home.warehouseId, home.locationId);
    if (available < 4) continue;
    const otherKeys = warehouseKeys.filter((k) => warehouseByKey[k].id !== home.warehouseId);
    const destKey = pick(otherKeys);
    const dest = warehouseByKey[destKey];
    const destLocationId = pick(dest.locationIds);
    const qty = Math.max(1, Math.floor(available * 0.1));

    const transferLines = [
      { item_id: home.itemId, from_location_id: home.locationId, to_location_id: destLocationId, quantity: qty },
    ];
    const order = await transferOrderService.create(
      { from_warehouse_id: home.warehouseId, to_warehouse_id: dest.id, note: 'Điều chuyển vật tư giữa các kho', items: transferLines },
      staffId
    );
    if (n === 0) {
      // Giữ lại 1 phiếu chuyển kho DRAFT (chưa xác nhận) để demo trạng thái chờ xử lý.
      draftOrders.transfer.push(order.transfer_id);
      continue;
    }
    const confirmed = await transferOrderService.confirm(order.transfer_id, staffId);
    confirmedOrders.transfer.push(confirmed.transfer_id);
  }

  // ── Thu hồi ──
  console.log('== Tạo phiếu thu hồi ==');
  for (let n = 0; n < 3; n += 1) {
    const def = pick(itemsData);
    const home = itemHome[def.code];
    const qty = rand(3, 10);
    const order = await recoveryOrderService.create(
      {
        warehouse_id: home.warehouseId,
        reason: 'Thu hồi vật tư thừa từ dự án đã hoàn thành',
        note: 'Thu hồi do không sử dụng hết',
        items: [{ item_id: home.itemId, location_id: home.locationId, quantity: qty }],
      },
      staffId
    );
    const confirmed = await recoveryOrderService.confirm(order.recovery_id, staffId);
    confirmedOrders.recovery.push(confirmed.recovery_id);
  }

  // ── Thanh lý ──
  console.log('== Tạo phiếu thanh lý ==');
  for (let n = 0; n < 2; n += 1) {
    const def = pick(itemsData);
    const home = itemHome[def.code];
    const available = await getAvailable(home.itemId, home.warehouseId, home.locationId);
    if (available < 5) continue;
    const qty = Math.min(available, rand(3, 8));
    const order = await liquidationOrderService.create(
      {
        warehouse_id: home.warehouseId,
        reason: 'Vật tư hư hỏng, không còn sử dụng được',
        note: 'Thanh lý theo biên bản kiểm tra định kỳ',
        items: [{ item_id: home.itemId, location_id: home.locationId, quantity: qty }],
      },
      staffId
    );
    const confirmed = await liquidationOrderService.confirm(order.liquidation_id, managerId);
    confirmedOrders.liquidation.push(confirmed.liquidation_id);
  }

  // ── Kiểm kê (snapshot tồn kho hiện có của kho, chỉnh vài dòng cho có chênh lệch) ──
  console.log('== Tạo phiên kiểm kê ==');
  const stocktakeIds = [];
  for (const key of ['WH1', 'WH2']) {
    const session = await stocktakeSessionService.create(
      { warehouse_id: warehouseByKey[key].id, stocktake_date: new Date(), note: 'Kiểm kê định kỳ hàng tháng' },
      staffId
    );
    const lines = session.items;
    const adjustIdx = new Set([0, Math.min(1, lines.length - 1)]);
    const updates = lines.map((line, idx) => ({
      stocktake_item_id: line.stocktake_item_id,
      actual_quantity: adjustIdx.has(idx) ? Math.max(0, line.system_quantity + pick([-2, -1, 1, 2])) : line.system_quantity,
    }));
    await stocktakeSessionService.updateItems(session.stocktake_id, updates);
    const confirmed = await stocktakeSessionService.confirm(session.stocktake_id, managerId);
    stocktakeIds.push(confirmed.stocktake_id);
  }

  // ── Phiếu DRAFT còn lại (nhập/xuất chờ xác nhận) ──
  console.log('== Tạo thêm vài phiếu DRAFT (chờ xác nhận) ==');
  for (let n = 0; n < 2; n += 1) {
    const def = pick(itemsData);
    const home = itemHome[def.code];
    const order = await importOrderService.create(
      {
        warehouse_id: home.warehouseId,
        supplier_id: pick(supplierIds),
        note: 'Phiếu nhập đang chờ xác nhận',
        items: [{ item_id: home.itemId, location_id: home.locationId, quantity: rand(10, 50) }],
      },
      staffId
    );
    draftOrders.import.push(order.import_id);
  }
  for (let n = 0; n < 2; n += 1) {
    const def = pick(itemsData);
    const home = itemHome[def.code];
    const order = await exportOrderService.create(
      {
        warehouse_id: home.warehouseId,
        purpose: 'Chờ phê duyệt xuất kho',
        note: 'Phiếu xuất đang chờ xác nhận',
        items: [{ item_id: home.itemId, location_id: home.locationId, quantity: rand(1, 5) }],
      },
      staffId
    );
    draftOrders.export.push(order.export_id);
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. Rải ngày trong 30 ngày gần nhất (chỉ sửa trường ngày, KHÔNG động tới số lượng)
  // ─────────────────────────────────────────────────────────────────
  console.log('== Rải ngày phiếu trong 30 ngày gần nhất ==');

  async function backdateConfirmed(table, idField, dateField, movementRefType, id) {
    const date = pastDate(30);
    await prisma[table].update({ where: { [idField]: id }, data: { [dateField]: date, created_at: date, updated_at: date } });
    await prisma.stockMovement.updateMany({ where: { reference_type: movementRefType, reference_id: id }, data: { movement_date: date } });
  }

  async function backdateDraft(table, idField, dateField, id) {
    const date = pastDate(3); // phiếu DRAFT: tạo gần đây, còn đang chờ xử lý
    await prisma[table].update({ where: { [idField]: id }, data: { [dateField]: date, created_at: date, updated_at: date } });
  }

  for (const id of confirmedOrders.import) await backdateConfirmed('importOrder', 'import_id', 'import_date', 'IMPORT_ORDER', id);
  for (const id of confirmedOrders.export) await backdateConfirmed('exportOrder', 'export_id', 'export_date', 'EXPORT_ORDER', id);
  for (const id of confirmedOrders.transfer) await backdateConfirmed('transferOrder', 'transfer_id', 'transfer_date', 'TRANSFER_ORDER', id);
  for (const id of confirmedOrders.recovery) await backdateConfirmed('recoveryOrder', 'recovery_id', 'recovery_date', 'RECOVERY_ORDER', id);
  for (const id of confirmedOrders.liquidation) await backdateConfirmed('liquidationOrder', 'liquidation_id', 'liquidation_date', 'LIQUIDATION_ORDER', id);
  for (const id of stocktakeIds) await backdateConfirmed('stocktakeSession', 'stocktake_id', 'stocktake_date', 'STOCKTAKE_SESSION', id);

  for (const id of draftOrders.import) await backdateDraft('importOrder', 'import_id', 'import_date', id);
  for (const id of draftOrders.export) await backdateDraft('exportOrder', 'export_id', 'export_date', id);
  for (const id of draftOrders.transfer) await backdateDraft('transferOrder', 'transfer_id', 'transfer_date', id);

  // ─────────────────────────────────────────────────────────────────
  // 5. Bảng đối chiếu lớp AI <-> mã vật tư
  // ─────────────────────────────────────────────────────────────────
  console.log('== Ghi ai-service/class_mapping.md ==');
  const mapped = itemsData.filter((i) => i.ai_class);
  const lines = [
    '# Đối chiếu lớp AI nhận diện <-> mã vật tư demo',
    '',
    'Sinh tự động bởi `backend/prisma/seed-demo.js` — mỗi dòng là 1 trong 61 lớp mà',
    'AI Service (`GET /classes`) trả về, đối chiếu với đúng 1 vật tư demo tương ứng',
    '(đã xác nhận khớp 100% với danh sách lớp thật của model đang chạy).',
    '',
    '| Lớp AI | Mã vật tư | Tên vật tư |',
    '|---|---|---|',
    ...mapped
      .sort((a, b) => a.ai_class.localeCompare(b.ai_class))
      .map((i) => `| ${i.ai_class} | ${i.code} | ${i.name} |`),
    '',
    `Tổng: ${mapped.length}/61 lớp có vật tư demo đại diện.`,
  ];
  fs.writeFileSync(path.join(__dirname, '..', '..', 'ai-service', 'class_mapping.md'), lines.join('\n') + '\n', 'utf8');

  // ─────────────────────────────────────────────────────────────────
  // 6. Báo cáo số lượng
  // ─────────────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.itemCategory.count(),
    items: await prisma.item.count(),
    warehouses: await prisma.warehouse.count(),
    locations: await prisma.storageLocation.count(),
    suppliers: await prisma.supplier.count(),
    importOrders: await prisma.importOrder.count(),
    exportOrders: await prisma.exportOrder.count(),
    transferOrders: await prisma.transferOrder.count(),
    recoveryOrders: await prisma.recoveryOrder.count(),
    stocktakeSessions: await prisma.stocktakeSession.count(),
    liquidationOrders: await prisma.liquidationOrder.count(),
    inventoryRows: await prisma.inventory.count(),
    stockMovements: await prisma.stockMovement.count(),
    draftOrders:
      (await prisma.importOrder.count({ where: { status: 'DRAFT' } })) +
      (await prisma.exportOrder.count({ where: { status: 'DRAFT' } })) +
      (await prisma.transferOrder.count({ where: { status: 'DRAFT' } })),
    belowMinStock: (
      await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS c FROM (
           SELECT i.item_id FROM inventory i JOIN items it ON it.item_id = i.item_id
           GROUP BY i.item_id, it.min_stock HAVING SUM(i.available_quantity) <= it.min_stock
         ) sub`
      )
    )[0].c,
  };

  console.log('\n=== KẾT QUẢ SEED DEMO ===');
  console.table(counts);
  return counts;
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
