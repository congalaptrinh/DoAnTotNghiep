const { app, request, loginAdmin, createFixture } = require('./helpers');

describe('AI (F1-F2) — mock detect + from-ai thật', () => {
  let adminToken;
  let fx;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    fx = await createFixture(adminToken);
  });

  test('F1: POST /api/ai/detect upload ảnh giả -> đúng cấu trúc {detections,summary,annotated_image}', async () => {
    const r = await request(app)
      .post('/api/ai/detect')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), { filename: 'fake.jpg', contentType: 'image/jpeg' });

    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data.detections)).toBe(true);
    expect(r.body.data.detections.length).toBeGreaterThan(0);
    for (const d of r.body.data.detections) {
      expect(typeof d.class_name).toBe('string');
      expect(typeof d.confidence).toBe('number');
      expect(typeof d.bounding_box.x).toBe('number');
      expect(typeof d.bounding_box.y).toBe('number');
      expect(typeof d.bounding_box.width).toBe('number');
      expect(typeof d.bounding_box.height).toBe('number');
    }
    expect(Array.isArray(r.body.data.summary)).toBe(true);
    expect(r.body.data.annotated_image.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  test('F1: không gửi file -> 400', async () => {
    const r = await request(app).post('/api/ai/detect').set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(400);
  });

  test('F2: POST /api/import-orders/from-ai -> phiếu CONFIRMED ngay, tồn kho cộng đúng', async () => {
    const r = await request(app)
      .post('/api/import-orders/from-ai')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouse_id: fx.warehouse.warehouse_id, items: [{ item_id: fx.item.item_id, location_id: fx.location.location_id, quantity: 12 }] });

    expect(r.status).toBe(201);
    expect(r.body.data.status).toBe('CONFIRMED');

    const inv = await request(app).get(`/api/inventory?item_id=${fx.item.item_id}&location_id=${fx.location.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(inv.body.data[0].quantity).toBe(12);
  });
});
