const request = require('supertest');
const app = require('../src/app');

function rand() {
  return Math.random().toString(36).slice(2, 10);
}

async function loginAdmin() {
  const r = await request(app).post('/api/auth/login').send({ email: 'admin@warehouse.local', password: 'Admin@123' });
  return r.body.data.token;
}

async function getRoleId(adminToken, roleName) {
  const r = await request(app).get('/api/roles').set('Authorization', `Bearer ${adminToken}`);
  return r.body.data.find((role) => role.role_name === roleName).role_id;
}

// Tạo 1 user với role chỉ định (qua chính API /api/users) rồi đăng nhập, trả về token + thông tin user.
async function createAndLoginUser(adminToken, roleName) {
  const roleId = await getRoleId(adminToken, roleName);
  const email = `test.${roleName}.${rand()}@warehouse.local`;
  const password = 'Test@123';

  const createRes = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ full_name: `Test ${roleName}`, email, password, role_id: roleId });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });

  return { token: loginRes.body.data.token, user: createRes.body.data, email, password };
}

async function createCategory(token, overrides = {}) {
  const r = await request(app)
    .post('/api/item-categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ category_name: `Cat ${rand()}`, ...overrides });
  return r.body.data;
}

async function createItem(token, categoryId, overrides = {}) {
  const r = await request(app)
    .post('/api/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ item_code: `ITM-${rand()}`, item_name: `Item ${rand()}`, category_id: categoryId, unit: 'cai', ...overrides });
  return r.body.data;
}

async function createWarehouse(token, overrides = {}) {
  const r = await request(app)
    .post('/api/warehouses')
    .set('Authorization', `Bearer ${token}`)
    .send({ warehouse_name: `Warehouse ${rand()}`, ...overrides });
  return r.body.data;
}

async function createLocation(token, warehouseId, overrides = {}) {
  const r = await request(app)
    .post('/api/storage-locations')
    .set('Authorization', `Bearer ${token}`)
    .send({ warehouse_id: warehouseId, location_code: `LOC-${rand()}`, ...overrides });
  return r.body.data;
}

async function createSupplier(token, overrides = {}) {
  const r = await request(app)
    .post('/api/suppliers')
    .set('Authorization', `Bearer ${token}`)
    .send({ supplier_name: `Supplier ${rand()}`, ...overrides });
  return r.body.data;
}

// Dựng nhanh 1 bộ fixture tối thiểu (category -> item, warehouse -> location) dùng chung cho các test nghiệp vụ kho.
async function createFixture(token) {
  const category = await createCategory(token);
  const item = await createItem(token, category.category_id);
  const warehouse = await createWarehouse(token);
  const location = await createLocation(token, warehouse.warehouse_id);
  return { category, item, warehouse, location };
}

async function importStock(token, warehouseId, itemId, locationId, quantity) {
  const create = await request(app)
    .post('/api/import-orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ warehouse_id: warehouseId, items: [{ item_id: itemId, location_id: locationId, quantity }] });
  const confirm = await request(app)
    .post(`/api/import-orders/${create.body.data.import_id}/confirm`)
    .set('Authorization', `Bearer ${token}`);
  return confirm.body.data;
}

module.exports = {
  app,
  request,
  rand,
  loginAdmin,
  getRoleId,
  createAndLoginUser,
  createCategory,
  createItem,
  createWarehouse,
  createLocation,
  createSupplier,
  createFixture,
  importStock,
};
