const { app, request, loginAdmin, createFixture, importStock } = require('./helpers');

describe('Recovery Orders (E4)', () => {
  let adminToken;
  let fx;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    fx = await createFixture(adminToken);
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 50);
  });

  test('happy path: thu hồi 5 -> tồn kho tăng đúng, ghi RECOVERY', async () => {
    const create = await request(app)
      .post('/api/recovery-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 5 }] });
    const confirm = await request(app).post(`/api/recovery-orders/${create.body.data.recovery_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);

    const inv = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv.body.data[0].quantity).toBe(55);

    const moves = await request(app).get(`/api/stock-movements?movement_type=RECOVERY&item_id=${fx.item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(moves.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('thu hồi vào vị trí chưa từng có tồn kho -> tự tạo dòng inventory mới (upsert)', async () => {
    const { createLocation } = require('./helpers');
    const newLoc = await createLocation(adminToken, fx.warehouse.warehouse_id);

    const create = await request(app)
      .post('/api/recovery-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: newLoc.location_id, quantity: 8 }] });
    const confirm = await request(app).post(`/api/recovery-orders/${create.body.data.recovery_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);

    const inv = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${newLoc.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv.body.data[0].quantity).toBe(8);
  });
});
