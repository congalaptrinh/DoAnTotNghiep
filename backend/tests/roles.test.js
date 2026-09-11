const { app, request, loginAdmin, createAndLoginUser, rand } = require('./helpers');

describe('Roles (C1) — chỉ admin', () => {
  let adminToken;
  let viewer;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    viewer = await createAndLoginUser(adminToken, 'report_viewer');
  });

  test('admin CRUD /api/roles hoạt động', async () => {
    const create = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role_name: `test_role_${rand()}`, description: 'role tạo trong test' });
    expect(create.status).toBe(201);

    const list = await request(app).get('/api/roles').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(5);

    const del = await request(app).delete(`/api/roles/${create.body.data.role_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const getAfterDelete = await request(app).get(`/api/roles/${create.body.data.role_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(getAfterDelete.status).toBe(404); // xoá thật, không phải soft-delete
  });

  test('RBAC: report_viewer GET /api/roles -> 403', async () => {
    const r = await request(app).get('/api/roles').set('Authorization', `Bearer ${viewer.token}`);
    expect(r.status).toBe(403);
  });

  test('DELETE role đang bị user tham chiếu -> 409 (chặn bởi FK, không xoá được)', async () => {
    // Tạo hẳn 1 user role mới, chỉ để tham chiếu (không phụ thuộc test file khác đã tạo staff hay chưa)
    const referencedUser = await createAndLoginUser(adminToken, 'warehouse_manager');
    const roles = await request(app).get('/api/roles').set('Authorization', `Bearer ${adminToken}`);
    const managerRole = roles.body.data.find((r) => r.role_name === 'warehouse_manager');
    const r = await request(app).delete(`/api/roles/${managerRole.role_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(409);
    expect(referencedUser.user.user_id).toBeTruthy(); // giữ tham chiếu qua eslint no-unused
  });
});
