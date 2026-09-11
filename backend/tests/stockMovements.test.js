const { app, request, loginAdmin, createFixture, createLocation, importStock } = require('./helpers');

describe('Stock Movements (E7) — lịch sử, filter đầy đủ', () => {
  let adminToken;
  let fx;
  let locB;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    fx = await createFixture(adminToken);
    locB = await createLocation(adminToken, fx.warehouse.warehouse_id);

    // Sinh đủ 7 loại movement_type bằng chính các nghiệp vụ E1-E6 (không insert tay)
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 100); // IMPORT

    const exp = await request(app)
      .post('/api/export-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 20 }] });
    await request(app).post(`/api/export-orders/${exp.body.data.export_id}/confirm`).set('Authorization', `Bearer ${adminToken}`); // EXPORT

    const trf = await request(app)
      .post('/api/transfer-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        from_warehouse_id: fx.warehouse.warehouse_id,
        to_warehouse_id: fx.warehouse.warehouse_id,
        items: [{ item_id: fx.item.item_id, from_location_id: fx.location.location_id, to_location_id: locB.location_id, quantity: 10 }],
      });
    await request(app).post(`/api/transfer-orders/${trf.body.data.transfer_id}/confirm`).set('Authorization', `Bearer ${adminToken}`); // TRANSFER_OUT + TRANSFER_IN

    const rec = await request(app)
      .post('/api/recovery-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 5 }] });
    await request(app).post(`/api/recovery-orders/${rec.body.data.recovery_id}/confirm`).set('Authorization', `Bearer ${adminToken}`); // RECOVERY

    const stk = await request(app).post('/api/stocktake-sessions').set('Authorization', `Bearer ${adminToken}`).send({ warehouse_id: fx.warehouse.warehouse_id });
    const lineA = stk.body.data.items.find((i) => i.location_id === fx.location.location_id);
    const lineB = stk.body.data.items.find((i) => i.location_id === locB.location_id);
    await request(app)
      .patch(`/api/stocktake-sessions/${stk.body.data.stocktake_id}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          { stocktake_item_id: lineA.stocktake_item_id, actual_quantity: lineA.system_quantity - 5 },
          { stocktake_item_id: lineB.stocktake_item_id, actual_quantity: lineB.system_quantity },
        ],
      });
    await request(app).post(`/api/stocktake-sessions/${stk.body.data.stocktake_id}/confirm`).set('Authorization', `Bearer ${adminToken}`); // ADJUSTMENT_STOCKTAKE

    const liq = await request(app)
      .post('/api/liquidation-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 10 }] });
    await request(app).post(`/api/liquidation-orders/${liq.body.data.liquidation_id}/confirm`).set('Authorization', `Bearer ${adminToken}`); // LIQUIDATION
  });

  test('lọc theo item_id -> đủ 7/7 loại movement_type', async () => {
    const r = await request(app).get(`/api/stock-movements?item_id=${fx.item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    const types = new Set(r.body.data.map((m) => m.movement_type));
    for (const t of ['IMPORT', 'EXPORT', 'TRANSFER_OUT', 'TRANSFER_IN', 'RECOVERY', 'ADJUSTMENT_STOCKTAKE', 'LIQUIDATION']) {
      expect(types.has(t)).toBe(true);
    }
  });

  test('thứ tự trả về tăng dần theo movement_date', async () => {
    const r = await request(app).get(`/api/stock-movements?item_id=${fx.item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    const dates = r.body.data.map((m) => new Date(m.movement_date).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
    }
  });

  test('lọc theo movement_type=IMPORT -> chỉ đúng loại đó', async () => {
    const r = await request(app).get(`/api/stock-movements?item_id=${fx.item.item_id}&movement_type=IMPORT`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.body.data.length).toBeGreaterThanOrEqual(1);
    expect(r.body.data.every((m) => m.movement_type === 'IMPORT')).toBe(true);
  });

  test('lọc theo location_id: locB chỉ có TRANSFER_IN', async () => {
    const r = await request(app).get(`/api/stock-movements?location_id=${locB.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.body.data.every((m) => m.movement_type === 'TRANSFER_IN')).toBe(true);
  });

  test('lọc theo reference_type=TRANSFER_ORDER -> đúng 2 dòng (OUT+IN cùng phiếu)', async () => {
    const r = await request(app).get(`/api/stock-movements?item_id=${fx.item.item_id}&reference_type=TRANSFER_ORDER`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.body.data.length).toBe(2);
  });
});
