const { app, request, loginAdmin, createAndLoginUser } = require('./helpers');

describe('Users (C1) — chỉ admin', () => {
  let adminToken;
  let staff;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
  });

  test('admin CRUD /api/users hoạt động', async () => {
    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    const detail = await request(app).get(`/api/users/${staff.user.user_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.email).toBe(staff.email);
  });

  test('RBAC: staff GET /api/users -> 403', async () => {
    const r = await request(app).get('/api/users').set('Authorization', `Bearer ${staff.token}`);
    expect(r.status).toBe(403);
  });

  test('DELETE = soft delete (khoá tài khoản), login bị chặn rồi mở lại được', async () => {
    const del = await request(app).delete(`/api/users/${staff.user.user_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const loginAfterLock = await request(app).post('/api/auth/login').send({ email: staff.email, password: staff.password });
    expect(loginAfterLock.status).toBe(403);
    expect(loginAfterLock.body.message).toMatch(/khóa/);

    // record vẫn còn (soft delete, không xoá thật), status = INACTIVE
    const stillExists = await request(app).get(`/api/users/${staff.user.user_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(stillExists.status).toBe(200);
    expect(stillExists.body.data.status).toBe('INACTIVE');

    const reactivate = await request(app)
      .put(`/api/users/${staff.user.user_id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });
    expect(reactivate.status).toBe(200);

    const loginAfterUnlock = await request(app).post('/api/auth/login').send({ email: staff.email, password: staff.password });
    expect(loginAfterUnlock.status).toBe(200);
  });
});
