const {
  app,
  request,
  loginAdmin,
  createAndLoginUser,
  createFixture,
  createItem,
  createLocation,
  importStock,
} = require('./helpers');

describe('Stocktake Sessions (E5) — chỉ admin+manager, SET tuyệt đối', () => {
  let adminToken;
  let staff;
  let fx;
  let item2;
  let loc2;
  let item3;
  let loc3;
  let stkId;
  let stkItems;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
    fx = await createFixture(adminToken); // item1 @ location trong fx
    item2 = await createItem(adminToken, fx.category.category_id);
    loc2 = await createLocation(adminToken, fx.warehouse.warehouse_id);
    item3 = await createItem(adminToken, fx.category.category_id);
    loc3 = await createLocation(adminToken, fx.warehouse.warehouse_id);

    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 55);
    await importStock(adminToken, fx.warehouse.warehouse_id, item2.item_id, loc2.location_id, 30);
    await importStock(adminToken, fx.warehouse.warehouse_id, item3.item_id, loc3.location_id, 20);
  });

  test('RBAC: staff POST /api/stocktake-sessions -> 403', async () => {
    const r = await request(app).post('/api/stocktake-sessions').set('Authorization', `Bearer ${staff.token}`).send({ warehouse_id: fx.warehouse.warehouse_id });
    expect(r.status).toBe(403);
  });

  test('tạo phiên snapshot đúng 3 dòng tồn kho hiện có, actual_quantity/difference = null', async () => {
    const create = await request(app).post('/api/stocktake-sessions').set('Authorization', `Bearer ${adminToken}`).send({ warehouse_id: fx.warehouse.warehouse_id });
    expect(create.status).toBe(201);
    expect(create.body.data.items.length).toBe(3);

    const line1 = create.body.data.items.find((i) => i.item_id === fx.item.item_id);
    expect(line1.system_quantity).toBe(55);
    expect(line1.actual_quantity).toBeNull();
    expect(line1.difference).toBeNull();

    // dùng lại phiên này cho các test tiếp theo trong cùng describe (module-scoped)
    stkId = create.body.data.stocktake_id;
    stkItems = create.body.data.items;
  });

  test('confirm sớm khi CHƯA nhập dòng nào -> 400', async () => {
    const r = await request(app).post(`/api/stocktake-sessions/${stkId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(400);
  });

  test('confirm khi CHỈ nhập 1/3 dòng -> vẫn bị chặn 400', async () => {
    const line1 = stkItems.find((i) => i.item_id === fx.item.item_id);
    await request(app)
      .patch(`/api/stocktake-sessions/${stkId}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ stocktake_item_id: line1.stocktake_item_id, actual_quantity: 50 }] });

    const r = await request(app).post(`/api/stocktake-sessions/${stkId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(400);
  });

  test('SET TUYỆT ĐỐI (không phải cộng difference vào live): nhập thêm hàng GIỮA lúc snapshot và confirm, verify inventory = actual_quantity', async () => {
    // Mô phỏng có nghiệp vụ nhập kho khác xảy ra SAU snapshot: item1 (đã snapshot 55) được nhập thêm 20 -> live = 75
    await importStock(adminToken, fx.warehouse.warehouse_id, fx.item.item_id, fx.location.location_id, 20);
    const liveCheck = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(liveCheck.body.data[0].quantity).toBe(75); // xác nhận live đã lệch khỏi snapshot (55)

    const line2 = stkItems.find((i) => i.item_id === item2.item_id);
    const line3 = stkItems.find((i) => i.item_id === item3.item_id);

    const patch = await request(app)
      .patch(`/api/stocktake-sessions/${stkId}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          { stocktake_item_id: line2.stocktake_item_id, actual_quantity: 35 }, // difference +5
          { stocktake_item_id: line3.stocktake_item_id, actual_quantity: 20 }, // difference 0
        ],
      });
    const patchedLine1 = patch.body.data.items.find((i) => i.item_id === fx.item.item_id);
    const patchedLine2 = patch.body.data.items.find((i) => i.item_id === item2.item_id);
    const patchedLine3 = patch.body.data.items.find((i) => i.item_id === item3.item_id);
    expect(patchedLine1.difference).toBe(-5); // 50 - 55 (so với system_quantity đã snapshot, KHÔNG so với live 75)
    expect(patchedLine2.difference).toBe(5);
    expect(patchedLine3.difference).toBe(0);

    const confirm = await request(app).post(`/api/stocktake-sessions/${stkId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.status).toBe(200);

    // *** Điểm kiểm chứng quan trọng nhất ***
    const inv1 = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv1.body.data[0].quantity).toBe(50); // SET = actual_quantity, KHÔNG phải 75 + (-5) = 70

    const inv2 = await request(app).get(`/api/inventory?item_id=${item2.item_id}&location_id=${loc2.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv2.body.data[0].quantity).toBe(35);

    const inv3 = await request(app).get(`/api/inventory?item_id=${item3.item_id}&location_id=${loc3.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv3.body.data[0].quantity).toBe(20); // không đổi

    const movesItem3 = await request(app).get(`/api/stock-movements?item_id=${item3.item_id}&movement_type=ADJUSTMENT_STOCKTAKE`).set('Authorization', `Bearer ${adminToken}`);
    expect(movesItem3.body.data.length).toBe(0); // difference=0 -> không ghi movement

    const movesItem1 = await request(app).get(`/api/stock-movements?item_id=${fx.item.item_id}&movement_type=ADJUSTMENT_STOCKTAKE`).set('Authorization', `Bearer ${adminToken}`);
    expect(movesItem1.body.data[0].quantity).toBe(-5); // quantity = difference, có dấu âm
  });
});
