const { app, request } = require('./helpers');

describe('Auth', () => {
  test('sai mật khẩu -> 401', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'admin@warehouse.local', password: 'sai-mat-khau' });
    expect(r.status).toBe(401);
    expect(r.body.success).toBe(false);
  });

  test('đăng nhập đúng -> 200, trả JWT, không lộ password_hash', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'admin@warehouse.local', password: 'Admin@123' });
    expect(r.status).toBe(200);
    expect(r.body.data.token).toBeTruthy();
    expect(r.body.data.user.password_hash).toBeUndefined();
  });

  test('GET /api/auth/me có token -> 200, trả đúng user', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@warehouse.local', password: 'Admin@123' });
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.token}`);
    expect(r.status).toBe(200);
    expect(r.body.data.email).toBe('admin@warehouse.local');
    expect(r.body.data.password_hash).toBeUndefined();
  });

  test('GET /api/auth/me không token -> 401', async () => {
    const r = await request(app).get('/api/auth/me');
    expect(r.status).toBe(401);
  });

  test('route lạ -> 404', async () => {
    const r = await request(app).get('/api/khong-ton-tai');
    expect(r.status).toBe(404);
  });
});
