const { app, request, loginAdmin, createFixture, importStock } = require('./helpers');

describe('Inventory (D) — đọc, filter, 4 role', () => {
  let adminToken;
  let fx;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    fx = await createFixture(adminToken);
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 42);
  });

  test('GET /api/inventory filter item_id/warehouse_id/location_id đúng', async () => {
    const byItem = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(byItem.body.data.length).toBe(1);
    expect(byItem.body.data[0].quantity).toBe(42);

    const byWarehouse = await request(app).get(`/api/inventory?warehouse_id=${fx.warehouse.warehouse_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(byWarehouse.body.data.some((i) => i.item_id === fx.item.item_id)).toBe(true);

    const byLocation = await request(app).get(`/api/inventory?location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(byLocation.body.data.length).toBe(1);
  });

  test('GET /api/inventory/:itemId trả đúng dòng theo vị trí', async () => {
    const r = await request(app).get(`/api/inventory/${fx.item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBe(1);
    expect(r.body.data[0].location.location_id).toBe(fx.location.location_id);
  });

  test('không có token -> 401', async () => {
    const r = await request(app).get('/api/inventory');
    expect(r.status).toBe(401);
  });
});
