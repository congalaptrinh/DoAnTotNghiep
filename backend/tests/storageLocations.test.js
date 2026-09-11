const { app, request, loginAdmin, createAndLoginUser, createWarehouse, createLocation, rand } = require('./helpers');

describe('Storage Locations (C3) — ghi=admin+manager+STAFF (khác warehouses), DELETE=soft', () => {
  let adminToken;
  let staff;
  let viewer;
  let warehouse;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    staff = await createAndLoginUser(adminToken, 'warehouse_staff');
    viewer = await createAndLoginUser(adminToken, 'report_viewer');
    warehouse = await createWarehouse(adminToken);
  });

  test('RBAC: staff POST -> 201 (staff ĐƯỢC quyền, khác warehouses/items/suppliers)', async () => {
    const r = await request(app)
      .post('/api/storage-locations')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ warehouse_id: warehouse.warehouse_id, location_code: `L-${rand()}` });
    expect(r.status).toBe(201);
  });

  test('RBAC: viewer POST -> 403', async () => {
    const r = await request(app)
      .post('/api/storage-locations')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ warehouse_id: warehouse.warehouse_id, location_code: `L-${rand()}` });
    expect(r.status).toBe(403);
  });

  test('filter warehouse_id hoạt động, DELETE = soft delete', async () => {
    const loc = await createLocation(adminToken, warehouse.warehouse_id);
    const filtered = await request(app).get(`/api/storage-locations?warehouse_id=${warehouse.warehouse_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(filtered.body.data.some((l) => l.location_id === loc.location_id)).toBe(true);

    const del = await request(app).delete(`/api/storage-locations/${loc.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    const after = await request(app).get(`/api/storage-locations/${loc.location_id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data.status).toBe('INACTIVE');
  });
});
