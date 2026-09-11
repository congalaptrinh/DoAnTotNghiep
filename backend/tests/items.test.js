const { app, request, loginAdmin, createAndLoginUser, createCategory, createItem, rand } = require('./helpers');

describe('Items (C2) — đọc=4 role, ghi=admin+manager, DELETE=soft', () => {
  let adminToken;
  let staff;
  let viewer;
  let category;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
    viewer = await createAndLoginUser(adminToken, 'report_viewer');
    category = await createCategory(adminToken);
  });

  test('RBAC: staff/viewer POST -> 403; staff GET -> 200 (đọc vẫn cho phép)', async () => {
    const staffPost = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ item_code: `X-${rand()}`, item_name: 'x', category_id: category.category_id, unit: 'cai' });
    expect(staffPost.status).toBe(403);

    const staffGet = await request(app).get('/api/items').set('Authorization', `Bearer ${staff.token}`);
    expect(staffGet.status).toBe(200);
  });

  test('filter category_id/status/search hoạt động đúng', async () => {
    const code = `FLT-${rand()}`;
    const item = await createItem(adminToken, category.category_id, { item_code: code, item_name: 'Special Widget' });

    const byCategory = await request(app).get(`/api/items?category_id=${category.category_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(byCategory.body.data.some((i) => i.item_id === item.item_id)).toBe(true);

    const bySearch = await request(app).get(`/api/items?search=${code}`).set('Authorization', `Bearer ${adminToken}`);
    expect(bySearch.body.data.some((i) => i.item_id === item.item_id)).toBe(true);

    const byStatus = await request(app).get('/api/items?status=ACTIVE').set('Authorization', `Bearer ${adminToken}`);
    expect(byStatus.body.data.every((i) => i.status === 'ACTIVE')).toBe(true);
  });

  test('DELETE = soft delete (status -> INACTIVE, record vẫn còn)', async () => {
    const item = await createItem(adminToken, category.category_id);
    const del = await request(app).delete(`/api/items/${item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/items/${item.item_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.status).toBe(200);
    expect(after.body.data.status).toBe('INACTIVE');
  });
});
