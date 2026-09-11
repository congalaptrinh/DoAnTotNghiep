const { app, request, loginAdmin, createAndLoginUser, createFixture, createItem, importStock } = require('./helpers');

describe('Liquidation Orders (E6) — chỉ admin+manager', () => {
  let adminToken;
  let staff;
  let fx;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
    fx = await createFixture(adminToken);
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 100);
  });

  test('RBAC: staff POST -> 403', async () => {
    const r = await request(app)
      .post('/api/liquidation-orders')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 1 }] });
    expect(r.status).toBe(403);
  });

  test('happy path: thanh lý 5 -> tồn kho giảm đúng, approver đúng người confirm', async () => {
    const create = await request(app)
      .post('/api/liquidation-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, reason: 'hỏng', items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 5 }] });
    const confirm = await request(app).post(`/api/liquidation-orders/${create.body.data.liquidation_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.approver.email).toBe('admin@warehouse.local');

    const inv = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv.body.data[0].quantity).toBe(95);
  });

  test('thiếu hàng -> 400, tồn kho không đổi', async () => {
    const before = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    const create = await request(app)
      .post('/api/liquidation-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 999999 }] });
    const confirm = await request(app).post(`/api/liquidation-orders/${create.body.data.liquidation_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(400);

    const after = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data[0].quantity).toBe(before.body.data[0].quantity);
  });

  test('ROLLBACK THẬT: phiếu 2 dòng, dòng 1 đủ hàng dòng 2 thiếu -> dòng 1 KHÔNG bị trừ, phiếu vẫn DRAFT', async () => {
    const before = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    const qtyBefore = before.body.data[0].quantity;
    const item2 = await createItem(adminToken, fx.category.category_id);

    const create = await request(app)
      .post('/api/liquidation-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        warehouse_id: fx.warehouse.warehouse_id,
        items: [
          { item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 10 },
          { item_id: item2.item_id, location_id: fx.location.location_id, quantity: 999999 },
        ],
      });
    const orderId = create.body.data.liquidation_id;
    const confirm = await request(app).post(`/api/liquidation-orders/${orderId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(400);

    const after = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data[0].quantity).toBe(qtyBefore);

    const orderAfter = await request(app).get(`/api/liquidation-orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(orderAfter.body.data.status).toBe('DRAFT');
  });
});
