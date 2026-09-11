const { app, request, loginAdmin, createAndLoginUser, createSupplier, rand } = require('./helpers');

describe('Suppliers (C4) — ghi=admin+manager, DELETE=soft', () => {
  let adminToken;
  let staff;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
  });

  test('RBAC: staff GET -> 200, POST -> 403', async () => {
    const get = await request(app).get('/api/suppliers').set('Authorization', `Bearer ${staff.token}`);
    expect(get.status).toBe(200);
    const post = await request(app).post('/api/suppliers').set('Authorization', `Bearer ${staff.token}`).send({ supplier_name: 'x' });
    expect(post.status).toBe(403);
  });

  test('filter search theo supplier_name; DELETE = soft delete', async () => {
    const name = `Unique Supplier ${rand()}`;
    const supplier = await createSupplier(adminToken, { supplier_name: name });

    const searched = await request(app).get(`/api/suppliers?search=${encodeURIComponent(name)}`).set('Authorization', `Bearer ${adminToken}`);
    expect(searched.body.data.some((s) => s.supplier_id === supplier.supplier_id)).toBe(true);

    const del = await request(app).delete(`/api/suppliers/${supplier.supplier_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    const after = await request(app).get(`/api/suppliers/${supplier.supplier_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data.status).toBe('INACTIVE');
  });
});
