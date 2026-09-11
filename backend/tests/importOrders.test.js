const { app, request, loginAdmin, createAndLoginUser, createFixture } = require('./helpers');

describe('Import Orders (E1)', () => {
  let adminToken;
  let staff;
  let viewer;
  let fx;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
    viewer = await createAndLoginUser(adminToken, 'report_viewer');
    fx = await createFixture(adminToken);
  });

  test('RBAC: viewer POST -> 403; staff POST -> 201 (staff được nhập kho)', async () => {
    const viewerRes = await request(app)
      .post('/api/import-orders')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 1 }] });
    expect(viewerRes.status).toBe(403);

    const staffRes = await request(app)
      .post('/api/import-orders')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 1 }] });
    expect(staffRes.status).toBe(201);
    expect(staffRes.body.data.status).toBe('DRAFT');
  });

  test('happy path: nhập 100 -> confirm -> inventory quantity=available=100, ghi đúng stock_movements IMPORT', async () => {
    const create = await request(app)
      .post('/api/import-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 100 }] });

    const confirm = await request(app).post(`/api/import-orders/${create.body.data.import_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe('CONFIRMED');

    const inv = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv.body.data[0].quantity).toBe(100);
    expect(inv.body.data[0].available_quantity).toBe(100);

    const movements = await request(app).get(`/api/stock-movements?item_id=${fx.item.item_id}&movement_type=IMPORT`).set('Authorization', `Bearer ${adminToken}`);
    expect(movements.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('confirm 2 lần -> lần 2 bị chặn 400 (không cộng tồn kho 2 lần)', async () => {
    const create = await request(app)
      .post('/api/import-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 10 }] });
    const id = create.body.data.import_id;

    const first = await request(app).post(`/api/import-orders/${id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(first.status).toBe(200);

    const second = await request(app).post(`/api/import-orders/${id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(second.status).toBe(400);
  });
});
