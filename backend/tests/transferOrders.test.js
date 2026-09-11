const { app, request, loginAdmin, createFixture, createLocation, createItem, importStock } = require('./helpers');

describe('Transfer Orders (E3)', () => {
  let adminToken;
  let fx;
  let locB;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    fx = await createFixture(adminToken);
    locB = await createLocation(adminToken, fx.warehouse.warehouse_id);
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 100);
  });

  test('happy path: chuyển 20 giữa 2 vị trí cùng kho -> nguồn giảm, đích tăng, ghi đủ TRANSFER_OUT+TRANSFER_IN', async () => {
    const create = await request(app)
      .post('/api/transfer-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        from_warehouse_id: fx.warehouse.warehouse_id,
        to_warehouse_id: fx.warehouse.warehouse_id,
        items: [{ item_id: fx.item.item_id, from_location_id: fx.location.location_id, to_location_id: locB.location_id, quantity: 20 }],
      });
    const confirm = await request(app).post(`/api/transfer-orders/${create.body.data.transfer_id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);

    const source = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(source.body.data[0].quantity).toBe(80);
    const dest = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${locB.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(dest.body.data[0].quantity).toBe(20);

    const outMoves = await request(app).get(`/api/stock-movements?reference_type=TRANSFER_ORDER&item_id=${fx.item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    const types = outMoves.body.data.map((m) => m.movement_type);
    expect(types).toContain('TRANSFER_OUT');
    expect(types).toContain('TRANSFER_IN');
  });

  test('ROLLBACK THẬT: thiếu hàng tại nguồn -> 400, nguồn/đích không đổi', async () => {
    const before = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    const qtyBefore = before.body.data[0].quantity;
    const destBefore = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${locB.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    const destQtyBefore = destBefore.body.data[0].quantity;

    const item2 = await createItem(adminToken, fx.category.category_id);

    const create = await request(app)
      .post('/api/transfer-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        from_warehouse_id: fx.warehouse.warehouse_id,
        to_warehouse_id: fx.warehouse.warehouse_id,
        items: [
          { item_id: fx.item.item_id, from_location_id: fx.location.location_id, to_location_id: locB.location_id, quantity: 15 },
          { item_id: item2.item_id, from_location_id: fx.location.location_id, to_location_id: locB.location_id, quantity: 999999 },
        ],
      });
    const orderId = create.body.data.transfer_id;
    const confirm = await request(app).post(`/api/transfer-orders/${orderId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(400);

    const sourceAfter = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(sourceAfter.body.data[0].quantity).toBe(qtyBefore);
    const destAfter = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${locB.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(destAfter.body.data[0].quantity).toBe(destQtyBefore);

    const orderAfter = await request(app).get(`/api/transfer-orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(orderAfter.body.data.status).toBe('DRAFT');
  });
});
