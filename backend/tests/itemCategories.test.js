const { app, request, loginAdmin, createAndLoginUser, createCategory, createItem, rand } = require('./helpers');

describe('Item Categories (C2) — đọc=4 role, ghi=admin+manager, DELETE=xoá thật', () => {
  let adminToken;
  let staff;
  let viewer;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
    viewer = await createAndLoginUser(adminToken, 'report_viewer');
  });

  test('4 role đều đọc được (viewer GET -> 200)', async () => {
    const r = await request(app).get('/api/item-categories').set('Authorization', `Bearer ${viewer.token}`);
    expect(r.status).toBe(200);
  });

  test('RBAC ghi: staff/viewer POST -> 403, admin POST -> 201', async () => {
    const staffRes = await request(app).post('/api/item-categories').set('Authorization', `Bearer ${staff.token}`).send({ category_name: 'x' });
    expect(staffRes.status).toBe(403);

    const viewerRes = await request(app).post('/api/item-categories').set('Authorization', `Bearer ${viewer.token}`).send({ category_name: 'x' });
    expect(viewerRes.status).toBe(403);

    const adminRes = await request(app).post('/api/item-categories').set('Authorization', `Bearer ${adminToken}`).send({ category_name: `Cat ${rand()}` });
    expect(adminRes.status).toBe(201);
  });

  test('DELETE = xoá thật; bị chặn 409 nếu còn item tham chiếu, xoá được khi trống', async () => {
    const category = await createCategory(adminToken);
    const item = await createItem(adminToken, category.category_id);

    const blockedDelete = await request(app).delete(`/api/item-categories/${category.category_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(blockedDelete.status).toBe(409);

    // xoá item trước rồi mới xoá category được (không soft-delete category để test xoá that)
    await request(app).delete(`/api/items/${item.item_id}`).set('Authorization', `Bearer ${adminToken}`); // soft-delete item, KHÔNG gỡ category_id
    // vì items là soft-delete (FK vẫn còn), category vẫn bị chặn xoá — verify đúng hành vi này
    const stillBlocked = await request(app).delete(`/api/item-categories/${category.category_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(stillBlocked.status).toBe(409);

    // dùng 1 category rỗng khác để verify xoá thật thành công
    const emptyCategory = await createCategory(adminToken);
    const del = await request(app).delete(`/api/item-categories/${emptyCategory.category_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const getAfter = await request(app).get(`/api/item-categories/${emptyCategory.category_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(getAfter.status).toBe(404); // xoá thật, không còn record
  });
});
