const { app, request, loginAdmin, createFixture, createItem, importStock } = require('./helpers');

describe('Export Orders (E2)', () => {
  let adminToken;
  let fx;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    fx = await createFixture(adminToken);
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 100);
  });

  test('happy path: xuất 30 -> còn 70, approved_by = người confirm', async () => {
    const create = await request(app)
      .post('/api/export-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 30 }] });

    const confirm = await request(app).post(`/api/export-orders/${create.body.data.export_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.approver.email).toBe('admin@warehouse.local');

    const inv = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv.body.data[0].quantity).toBe(70);
  });

  test('thiếu hàng -> 400, tồn kho KHÔNG đổi', async () => {
    const before = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    const qtyBefore = before.body.data[0].quantity;

    const create = await request(app)
      .post('/api/export-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 999999 }] });
    const confirm = await request(app).post(`/api/export-orders/${create.body.data.export_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(400);

    const after = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data[0].quantity).toBe(qtyBefore);
  });

  test('ROLLBACK THẬT: phiếu 2 dòng, dòng 1 đủ hàng dòng 2 thiếu hàng -> cả phiếu bị huỷ, dòng 1 KHÔNG bị trừ', async () => {
    const before = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    const qtyBefore = before.body.data[0].quantity;

    const item2 = await createItem(adminToken, fx.category.category_id); // chưa từng có tồn kho -> chắc chắn thiếu hàng

    const create = await request(app)
      .post('/api/export-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        warehouse_id: fx.warehouse.warehouse_id,
        items: [
          { item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 10 },
          { item_id: item2.item_id, location_id: fx.location.location_id, quantity: 999999 },
        ],
      });
    const orderId = create.body.data.export_id;

    const confirm = await request(app).post(`/api/export-orders/${orderId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(400);

    const after = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data[0].quantity).toBe(qtyBefore); // dòng 1 KHÔNG bị trừ

    const orderAfter = await request(app).get(`/api/export-orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(orderAfter.body.data.status).toBe('DRAFT'); // không lọt thành CONFIRMED

    const item2Inv = await request(app).get(`/api/inventory?item_id=${item2.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(item2Inv.body.data.length).toBe(0); // chưa từng tạo dòng inventory nào
  });
});
