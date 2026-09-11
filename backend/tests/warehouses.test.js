const { app, request, loginAdmin, createAndLoginUser, createWarehouse, rand } = require('./helpers');

describe('Warehouses (C3) — ghi=admin+manager, DELETE=soft', () => {
  let adminToken;
  let staff;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
  });

  test('RBAC: staff POST -> 403 (khác storage-locations)', async () => {
    const r = await request(app).post('/api/warehouses').set('Authorization', `Bearer ${staff.token}`).send({ warehouse_name: `x ${rand()}` });
    expect(r.status).toBe(403);
  });

  test('admin tạo + DELETE = soft delete', async () => {
    const wh = await createWarehouse(adminToken);
    const del = await request(app).delete(`/api/warehouses/${wh.warehouse_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/warehouses/${wh.warehouse_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data.status).toBe('INACTIVE');
  });
});
