// Sinh file warehouse-backend.postman_collection.json từ mô tả JS dưới đây.
// Lý do dùng script thay vì gõ tay JSON: dễ bảo trì/mở rộng khi thêm endpoint mới
// ở các giai đoạn sau (Web/Mobile/AI Service thật), tránh lỗi cú pháp JSON tay.
//
// Chạy: node postman/build-collection.js
const fs = require('fs');
const path = require('path');

function url(rawPath) {
  const [pathname, query] = rawPath.split('?');
  const pathParts = pathname.split('/').filter(Boolean).slice(1); // bỏ "api"
  const result = {
    raw: `{{base_url}}${rawPath}`,
    host: ['{{base_url}}'],
    path: ['api', ...pathParts],
  };
  if (query) {
    result.query = query.split('&').map((pair) => {
      const [key, value] = pair.split('=');
      return { key, value };
    });
  }
  return result;
}

function req({ name, method, path: p, token, body, formdata, tests = [], preScript }) {
  const header = [];
  if (token) header.push({ key: 'Authorization', value: `Bearer {{${token}}}`, type: 'text' });

  let bodyBlock;
  if (formdata) {
    bodyBlock = { mode: 'formdata', formdata };
  } else if (body !== undefined) {
    header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
    bodyBlock = { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
  }

  // Bọc mỗi test script trong 1 IIFE riêng: Newman dùng chung 1 JS context xuyên suốt
  // cả lần chạy collection, nên khai báo const/let ở top-level của 2 request khác nhau
  // (vd cùng tên "data") sẽ va nhau -> SyntaxError "already declared". IIFE tạo scope
  // riêng cho từng request, tránh hoàn toàn việc này.
  const event = [];
  if (preScript) event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: ['(function () {', ...preScript, '})();'] } });
  if (tests.length) event.push({ listen: 'test', script: { type: 'text/javascript', exec: ['(function () {', ...tests, '})();'] } });

  const item = { name, event, request: { method, header, url: url(p) } };
  if (bodyBlock) item.request.body = bodyBlock;
  return item;
}

// ─── Test script helpers (mảng dòng JS, nối bằng \n khi Postman chạy) ───
const T = {
  status: (code) => `pm.test("status ${code}", () => pm.response.to.have.status(${code}));`,
  saveFromData: (varName, field) => `if (pm.response.code < 300) { pm.collectionVariables.set("${varName}", pm.response.json().data.${field}); }`,
  saveRaw: (varName, expr) => `pm.collectionVariables.set("${varName}", ${expr});`,
  log: (msg) => `console.log(${JSON.stringify(msg)}, pm.response.code, JSON.stringify(pm.response.json()).slice(0,300));`,
};

const items = [];

// ═══════════════════════ 1. Auth ═══════════════════════
items.push({
  name: '01 - Auth',
  item: [
    req({
      name: 'Login Admin',
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@warehouse.local', password: 'Admin@123' },
      tests: [T.status(200), T.saveFromData('admin_token', 'token')],
    }),
    req({
      name: 'Get Me (admin)',
      method: 'GET',
      path: '/api/auth/me',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Login sai mật khẩu -> 401',
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@warehouse.local', password: 'sai-mat-khau' },
      tests: [T.status(401)],
    }),
  ],
});

// ═══════════════════════ 2. Roles ═══════════════════════
items.push({
  name: '02 - Roles',
  item: [
    req({
      name: 'List Roles (lưu role_id theo tên)',
      method: 'GET',
      path: '/api/roles',
      token: 'admin_token',
      tests: [
        T.status(200),
        `const roles = pm.response.json().data;`,
        `pm.collectionVariables.set("role_id_manager", roles.find(r => r.role_name === "warehouse_manager").role_id);`,
        `pm.collectionVariables.set("role_id_staff", roles.find(r => r.role_name === "warehouse_staff").role_id);`,
        `pm.collectionVariables.set("role_id_viewer", roles.find(r => r.role_name === "report_viewer").role_id);`,
      ],
    }),
    req({
      name: 'Create Role (temp, để test xoá)',
      method: 'POST',
      path: '/api/roles',
      token: 'admin_token',
      body: { role_name: 'temp_role_postman', description: 'role tạo tạm để test DELETE' },
      tests: [T.status(201), T.saveFromData('role_id_to_delete', 'role_id')],
    }),
    req({
      name: 'Update Role (temp)',
      method: 'PUT',
      path: '/api/roles/{{role_id_to_delete}}',
      token: 'admin_token',
      body: { description: 'đã cập nhật qua Postman' },
      tests: [T.status(200)],
    }),
    req({
      name: 'RBAC: viewer_token chưa có -> bỏ qua (test ở folder Users)',
      method: 'GET',
      path: '/api/roles',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Delete Role (temp, không bị tham chiếu) -> 200',
      method: 'DELETE',
      path: '/api/roles/{{role_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 3. Users ═══════════════════════
items.push({
  name: '03 - Users',
  item: [
    req({
      name: 'Create User Manager',
      method: 'POST',
      path: '/api/users',
      token: 'admin_token',
      body: { full_name: 'Postman Manager', email: '{{manager_email}}', password: 'Test@123', role_id: '{{role_id_manager}}' },
      preScript: [`pm.collectionVariables.set("manager_email", "postman.manager." + Date.now() + "@warehouse.local");`],
      tests: [T.status(201), T.saveFromData('user_id_manager', 'user_id')],
    }),
    req({
      name: 'Login Manager',
      method: 'POST',
      path: '/api/auth/login',
      body: '{"email": "{{manager_email}}", "password": "Test@123"}',
      tests: [T.status(200), T.saveFromData('manager_token', 'token')],
    }),
    req({
      name: 'Create User Staff',
      method: 'POST',
      path: '/api/users',
      token: 'admin_token',
      body: { full_name: 'Postman Staff', email: '{{staff_email}}', password: 'Test@123', role_id: '{{role_id_staff}}' },
      preScript: [`pm.collectionVariables.set("staff_email", "postman.staff." + Date.now() + "@warehouse.local");`],
      tests: [T.status(201), T.saveFromData('user_id_staff', 'user_id')],
    }),
    req({
      name: 'Login Staff',
      method: 'POST',
      path: '/api/auth/login',
      body: '{"email": "{{staff_email}}", "password": "Test@123"}',
      tests: [T.status(200), T.saveFromData('staff_token', 'token')],
    }),
    req({
      name: 'Create User Viewer',
      method: 'POST',
      path: '/api/users',
      token: 'admin_token',
      body: { full_name: 'Postman Viewer', email: '{{viewer_email}}', password: 'Test@123', role_id: '{{role_id_viewer}}' },
      preScript: [`pm.collectionVariables.set("viewer_email", "postman.viewer." + Date.now() + "@warehouse.local");`],
      tests: [T.status(201), T.saveFromData('user_id_viewer', 'user_id')],
    }),
    req({
      name: 'Login Viewer',
      method: 'POST',
      path: '/api/auth/login',
      body: '{"email": "{{viewer_email}}", "password": "Test@123"}',
      tests: [T.status(200), T.saveFromData('viewer_token', 'token')],
    }),
    req({
      name: 'Create User To Delete',
      method: 'POST',
      path: '/api/users',
      token: 'admin_token',
      body: { full_name: 'Postman ToDelete', email: '{{todelete_email}}', password: 'Test@123', role_id: '{{role_id_staff}}' },
      preScript: [`pm.collectionVariables.set("todelete_email", "postman.todelete." + Date.now() + "@warehouse.local");`],
      tests: [T.status(201), T.saveFromData('user_id_to_delete', 'user_id')],
    }),
    req({ name: 'List Users (admin)', method: 'GET', path: '/api/users', token: 'admin_token', tests: [T.status(200)] }),
    req({ name: 'Get User Detail', method: 'GET', path: '/api/users/{{user_id_manager}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Update User',
      method: 'PUT',
      path: '/api/users/{{user_id_manager}}',
      token: 'admin_token',
      body: { full_name: 'Postman Manager (updated)' },
      tests: [T.status(200)],
    }),
    req({ name: 'RBAC: staff List Users -> 403', method: 'GET', path: '/api/users', token: 'staff_token', tests: [T.status(403)] }),
    req({ name: 'RBAC: viewer List Roles -> 403', method: 'GET', path: '/api/roles', token: 'viewer_token', tests: [T.status(403)] }),
    req({
      name: 'Delete User To Delete (soft) -> 200',
      method: 'DELETE',
      path: '/api/users/{{user_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Login User Đã Bị Khoá -> 403',
      method: 'POST',
      path: '/api/auth/login',
      body: '{"email": "{{todelete_email}}", "password": "Test@123"}',
      tests: [T.status(403)],
    }),
    req({
      name: 'Reactivate User To Delete (status=ACTIVE)',
      method: 'PUT',
      path: '/api/users/{{user_id_to_delete}}',
      token: 'admin_token',
      body: { status: 'ACTIVE' },
      tests: [T.status(200)],
    }),
    req({
      name: 'Login User Sau Khi Mở Khoá -> 200',
      method: 'POST',
      path: '/api/auth/login',
      body: '{"email": "{{todelete_email}}", "password": "Test@123"}',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 4. Item Categories ═══════════════════════
items.push({
  name: '04 - Item Categories',
  item: [
    req({
      name: 'Create Category',
      method: 'POST',
      path: '/api/item-categories',
      token: 'admin_token',
      body: { category_name: 'Postman Category {{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('category_id', 'category_id')],
    }),
    req({
      name: 'Create Category To Delete (rỗng)',
      method: 'POST',
      path: '/api/item-categories',
      token: 'admin_token',
      body: { category_name: 'Postman Category ToDelete {{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('category_id_to_delete', 'category_id')],
    }),
    req({ name: 'List Categories', method: 'GET', path: '/api/item-categories', token: 'viewer_token', tests: [T.status(200)] }),
    req({ name: 'Get Category Detail', method: 'GET', path: '/api/item-categories/{{category_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Update Category',
      method: 'PUT',
      path: '/api/item-categories/{{category_id}}',
      token: 'admin_token',
      body: { description: 'cập nhật qua Postman' },
      tests: [T.status(200)],
    }),
    req({
      name: 'RBAC: staff Create Category -> 403',
      method: 'POST',
      path: '/api/item-categories',
      token: 'staff_token',
      body: { category_name: 'x' },
      tests: [T.status(403)],
    }),
    req({
      name: 'Delete Category To Delete (rỗng) -> 200',
      method: 'DELETE',
      path: '/api/item-categories/{{category_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 5. Items ═══════════════════════
items.push({
  name: '05 - Items',
  item: [
    req({
      name: 'Create Item',
      method: 'POST',
      path: '/api/items',
      token: 'admin_token',
      body: { item_code: 'PM-{{$timestamp}}', item_name: 'Postman Item', category_id: '{{category_id}}', unit: 'cai', min_stock: 5 },
      tests: [T.status(201), T.saveFromData('item_id', 'item_id')],
    }),
    req({
      name: 'Create Item To Delete',
      method: 'POST',
      path: '/api/items',
      token: 'admin_token',
      body: { item_code: 'PM-DEL-{{$timestamp}}', item_name: 'Postman Item ToDelete', category_id: '{{category_id}}', unit: 'cai' },
      tests: [T.status(201), T.saveFromData('item_id_to_delete', 'item_id')],
    }),
    req({ name: 'List Items (filter category_id)', method: 'GET', path: '/api/items?category_id={{category_id}}', token: 'staff_token', tests: [T.status(200)] }),
    req({ name: 'List Items (search)', method: 'GET', path: '/api/items?search=Postman', token: 'admin_token', tests: [T.status(200)] }),
    req({ name: 'Get Item Detail', method: 'GET', path: '/api/items/{{item_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Update Item',
      method: 'PUT',
      path: '/api/items/{{item_id}}',
      token: 'admin_token',
      body: { description: 'cập nhật qua Postman' },
      tests: [T.status(200)],
    }),
    req({
      name: 'RBAC: staff Create Item -> 403',
      method: 'POST',
      path: '/api/items',
      token: 'staff_token',
      body: { item_code: 'x', item_name: 'x', category_id: '{{category_id}}', unit: 'cai' },
      tests: [T.status(403)],
    }),
    req({
      name: 'Delete Item To Delete (soft) -> 200',
      method: 'DELETE',
      path: '/api/items/{{item_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Verify Item Soft-Deleted (status=INACTIVE, vẫn còn record)',
      method: 'GET',
      path: '/api/items/{{item_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("status INACTIVE", () => pm.expect(pm.response.json().data.status).to.eql("INACTIVE"));`],
    }),
    req({
      name: 'Delete Category (đang có item {{item_id}} tham chiếu) -> 409',
      method: 'DELETE',
      path: '/api/item-categories/{{category_id}}',
      token: 'admin_token',
      tests: [T.status(409)],
    }),
  ],
});

// ═══════════════════════ 6. Warehouses ═══════════════════════
items.push({
  name: '06 - Warehouses',
  item: [
    req({
      name: 'Create Warehouse',
      method: 'POST',
      path: '/api/warehouses',
      token: 'admin_token',
      body: { warehouse_name: 'Postman Warehouse {{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('warehouse_id', 'warehouse_id')],
    }),
    req({
      name: 'Create Warehouse To Delete',
      method: 'POST',
      path: '/api/warehouses',
      token: 'admin_token',
      body: { warehouse_name: 'Postman Warehouse ToDelete {{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('warehouse_id_to_delete', 'warehouse_id')],
    }),
    req({ name: 'List Warehouses', method: 'GET', path: '/api/warehouses', token: 'viewer_token', tests: [T.status(200)] }),
    req({ name: 'Get Warehouse Detail', method: 'GET', path: '/api/warehouses/{{warehouse_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Update Warehouse',
      method: 'PUT',
      path: '/api/warehouses/{{warehouse_id}}',
      token: 'admin_token',
      body: { address: '123 Postman Street' },
      tests: [T.status(200)],
    }),
    req({
      name: 'RBAC: staff Create Warehouse -> 403',
      method: 'POST',
      path: '/api/warehouses',
      token: 'staff_token',
      body: { warehouse_name: 'x' },
      tests: [T.status(403)],
    }),
    req({
      name: 'Delete Warehouse To Delete (soft) -> 200',
      method: 'DELETE',
      path: '/api/warehouses/{{warehouse_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 7. Storage Locations ═══════════════════════
items.push({
  name: '07 - Storage Locations',
  item: [
    req({
      name: 'Create Location A',
      method: 'POST',
      path: '/api/storage-locations',
      token: 'admin_token',
      body: { warehouse_id: '{{warehouse_id}}', location_code: 'PM-A-{{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('location_id', 'location_id')],
    }),
    req({
      name: 'Create Location B (đích cho chuyển kho)',
      method: 'POST',
      path: '/api/storage-locations',
      token: 'admin_token',
      body: { warehouse_id: '{{warehouse_id}}', location_code: 'PM-B-{{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('location_id_b', 'location_id')],
    }),
    req({
      name: 'Create Location To Delete',
      method: 'POST',
      path: '/api/storage-locations',
      token: 'admin_token',
      body: { warehouse_id: '{{warehouse_id}}', location_code: 'PM-DEL-{{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('location_id_to_delete', 'location_id')],
    }),
    req({ name: 'List Locations (filter warehouse_id)', method: 'GET', path: '/api/storage-locations?warehouse_id={{warehouse_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({ name: 'Get Location Detail', method: 'GET', path: '/api/storage-locations/{{location_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Update Location',
      method: 'PUT',
      path: '/api/storage-locations/{{location_id}}',
      token: 'admin_token',
      body: { area: 'A1' },
      tests: [T.status(200)],
    }),
    req({
      name: 'RBAC: staff Create Location -> 201 (staff ĐƯỢC quyền, khác warehouses/items)',
      method: 'POST',
      path: '/api/storage-locations',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}', location_code: 'PM-STAFF-{{$timestamp}}' },
      tests: [T.status(201)],
    }),
    req({
      name: 'RBAC: viewer Create Location -> 403',
      method: 'POST',
      path: '/api/storage-locations',
      token: 'viewer_token',
      body: { warehouse_id: '{{warehouse_id}}', location_code: 'x' },
      tests: [T.status(403)],
    }),
    req({
      name: 'Delete Location To Delete (soft) -> 200',
      method: 'DELETE',
      path: '/api/storage-locations/{{location_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 8. Suppliers ═══════════════════════
items.push({
  name: '08 - Suppliers',
  item: [
    req({
      name: 'Create Supplier',
      method: 'POST',
      path: '/api/suppliers',
      token: 'admin_token',
      body: { supplier_name: 'Postman Supplier {{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('supplier_id', 'supplier_id')],
    }),
    req({
      name: 'Create Supplier To Delete',
      method: 'POST',
      path: '/api/suppliers',
      token: 'admin_token',
      body: { supplier_name: 'Postman Supplier ToDelete {{$timestamp}}' },
      tests: [T.status(201), T.saveFromData('supplier_id_to_delete', 'supplier_id')],
    }),
    req({ name: 'List Suppliers (search)', method: 'GET', path: '/api/suppliers?search=Postman', token: 'staff_token', tests: [T.status(200)] }),
    req({ name: 'Get Supplier Detail', method: 'GET', path: '/api/suppliers/{{supplier_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Update Supplier',
      method: 'PUT',
      path: '/api/suppliers/{{supplier_id}}',
      token: 'admin_token',
      body: { phone: '0900000000' },
      tests: [T.status(200)],
    }),
    req({
      name: 'RBAC: staff Create Supplier -> 403',
      method: 'POST',
      path: '/api/suppliers',
      token: 'staff_token',
      body: { supplier_name: 'x' },
      tests: [T.status(403)],
    }),
    req({
      name: 'Delete Supplier To Delete (soft) -> 200',
      method: 'DELETE',
      path: '/api/suppliers/{{supplier_id_to_delete}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 9. Import Orders ═══════════════════════
items.push({
  name: '09 - Import Orders (E1)',
  item: [
    req({
      name: 'Create Import Order (100 đơn vị)',
      method: 'POST',
      path: '/api/import-orders',
      token: 'staff_token',
      body: { supplier_id: '{{supplier_id}}', warehouse_id: '{{warehouse_id}}', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 100, unit_price: 15000 }] },
      tests: [T.status(201), T.saveFromData('import_id', 'import_id'), `pm.test("status DRAFT", () => pm.expect(pm.response.json().data.status).to.eql("DRAFT"));`],
    }),
    req({ name: 'Get Import Order Detail', method: 'GET', path: '/api/import-orders/{{import_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({
      name: 'Confirm Import Order',
      method: 'POST',
      path: '/api/import-orders/{{import_id}}/confirm',
      token: 'staff_token',
      tests: [T.status(200), `pm.test("status CONFIRMED", () => pm.expect(pm.response.json().data.status).to.eql("CONFIRMED"));`],
    }),
    req({
      name: 'Confirm Lại Lần 2 -> 400 (không cộng tồn kho 2 lần)',
      method: 'POST',
      path: '/api/import-orders/{{import_id}}/confirm',
      token: 'staff_token',
      tests: [T.status(400)],
    }),
    req({ name: 'List Import Orders', method: 'GET', path: '/api/import-orders?warehouse_id={{warehouse_id}}', token: 'viewer_token', tests: [T.status(200)] }),
    req({
      name: 'RBAC: viewer Create Import Order -> 403',
      method: 'POST',
      path: '/api/import-orders',
      token: 'viewer_token',
      body: { warehouse_id: '{{warehouse_id}}', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 1 }] },
      tests: [T.status(403)],
    }),
  ],
});

// ═══════════════════════ 10. Inventory ═══════════════════════
items.push({
  name: '10 - Inventory (D)',
  item: [
    req({
      name: 'List Inventory (filter item_id) -> quantity = 100',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("quantity = 100 sau nhap kho", () => pm.expect(pm.response.json().data[0].quantity).to.eql(100));`, T.saveRaw('inventory_qty_before_export', 'pm.response.json().data[0].quantity')],
    }),
    req({ name: 'Get Inventory By ItemId', method: 'GET', path: '/api/inventory/{{item_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({ name: 'List Inventory (filter warehouse_id)', method: 'GET', path: '/api/inventory?warehouse_id={{warehouse_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({ name: 'List Inventory (filter location_id)', method: 'GET', path: '/api/inventory?location_id={{location_id}}', token: 'admin_token', tests: [T.status(200)] }),
    req({ name: 'Không token -> 401', method: 'GET', path: '/api/inventory', tests: [T.status(401)] }),
  ],
});

// ═══════════════════════ 11. Export Orders ═══════════════════════
items.push({
  name: '11 - Export Orders (E2)',
  item: [
    req({
      name: 'Create Export Order (30 đơn vị)',
      method: 'POST',
      path: '/api/export-orders',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}', purpose: 'test postman', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 30 }] },
      tests: [T.status(201), T.saveFromData('export_id', 'export_id')],
    }),
    req({
      name: 'Confirm Export Order -> tồn kho 100 - 30 = 70',
      method: 'POST',
      path: '/api/export-orders/{{export_id}}/confirm',
      token: 'staff_token',
      tests: [T.status(200), `pm.test("approved_by đúng người confirm", () => pm.expect(pm.response.json().data.approver.email).to.include("warehouse.local"));`],
    }),
    req({
      name: 'Verify Inventory = 70 Sau Xuất',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("quantity = 70", () => pm.expect(pm.response.json().data[0].quantity).to.eql(70));`, T.saveRaw('inventory_qty_before_fail', 'pm.response.json().data[0].quantity')],
    }),
    req({
      name: 'Create Export Order THIẾU HÀNG (999999)',
      method: 'POST',
      path: '/api/export-orders',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 999999 }] },
      tests: [T.status(201), T.saveFromData('export_id_insufficient', 'export_id')],
    }),
    req({
      name: 'Confirm Export THIẾU HÀNG -> 400',
      method: 'POST',
      path: '/api/export-orders/{{export_id_insufficient}}/confirm',
      token: 'staff_token',
      tests: [T.status(400)],
    }),
    req({
      name: 'Verify Inventory KHÔNG Đổi Sau Thất Bại',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("quantity không đổi (vẫn 70)", () => pm.expect(pm.response.json().data[0].quantity).to.eql(pm.collectionVariables.get("inventory_qty_before_fail")));`],
    }),
    req({ name: 'List Export Orders', method: 'GET', path: '/api/export-orders', token: 'admin_token', tests: [T.status(200)] }),
  ],
});

// ═══════════════════════ 12. Transfer Orders ═══════════════════════
items.push({
  name: '12 - Transfer Orders (E3)',
  item: [
    req({
      name: 'Create Transfer Order (20 đơn vị, locA -> locB)',
      method: 'POST',
      path: '/api/transfer-orders',
      token: 'staff_token',
      body: { from_warehouse_id: '{{warehouse_id}}', to_warehouse_id: '{{warehouse_id}}', items: [{ item_id: '{{item_id}}', from_location_id: '{{location_id}}', to_location_id: '{{location_id_b}}', quantity: 20 }] },
      tests: [T.status(201), T.saveFromData('transfer_id', 'transfer_id')],
    }),
    req({
      name: 'Confirm Transfer Order',
      method: 'POST',
      path: '/api/transfer-orders/{{transfer_id}}/confirm',
      token: 'staff_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Verify Nguồn Giảm (70 -> 50)',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("nguồn = 50", () => pm.expect(pm.response.json().data[0].quantity).to.eql(50));`],
    }),
    req({
      name: 'Verify Đích Tăng (0 -> 20)',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id_b}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("đích = 20", () => pm.expect(pm.response.json().data[0].quantity).to.eql(20));`],
    }),
    req({ name: 'List Transfer Orders', method: 'GET', path: '/api/transfer-orders', token: 'admin_token', tests: [T.status(200)] }),
  ],
});

// ═══════════════════════ 13. Recovery Orders ═══════════════════════
items.push({
  name: '13 - Recovery Orders (E4)',
  item: [
    req({
      name: 'Create Recovery Order (5 đơn vị)',
      method: 'POST',
      path: '/api/recovery-orders',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}', reason: 'test postman', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 5 }] },
      tests: [T.status(201), T.saveFromData('recovery_id', 'recovery_id')],
    }),
    req({
      name: 'Confirm Recovery Order',
      method: 'POST',
      path: '/api/recovery-orders/{{recovery_id}}/confirm',
      token: 'staff_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Verify Tồn Kho Tăng (50 -> 55)',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("quantity = 55", () => pm.expect(pm.response.json().data[0].quantity).to.eql(55));`],
    }),
    req({ name: 'List Recovery Orders', method: 'GET', path: '/api/recovery-orders', token: 'admin_token', tests: [T.status(200)] }),
  ],
});

// ═══════════════════════ 14. Stocktake Sessions ═══════════════════════
items.push({
  name: '14 - Stocktake Sessions (E5)',
  item: [
    req({
      name: 'RBAC: staff Create Session -> 403',
      method: 'POST',
      path: '/api/stocktake-sessions',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}' },
      tests: [T.status(403)],
    }),
    req({
      name: 'Create Stocktake Session (snapshot toàn bộ tồn kho của kho)',
      method: 'POST',
      path: '/api/stocktake-sessions',
      token: 'admin_token',
      body: { warehouse_id: '{{warehouse_id}}' },
      tests: [
        T.status(201),
        T.saveFromData('stocktake_id', 'stocktake_id'),
        `const items = pm.response.json().data.items;`,
        `pm.collectionVariables.set("stocktake_patch_body", JSON.stringify({ items: items.map(i => ({ stocktake_item_id: i.stocktake_item_id, actual_quantity: i.item_id === pm.collectionVariables.get("item_id") ? i.system_quantity - 5 : i.system_quantity })) }));`,
      ],
    }),
    req({
      name: 'Confirm Sớm Khi Chưa Nhập -> 400',
      method: 'POST',
      path: '/api/stocktake-sessions/{{stocktake_id}}/confirm',
      token: 'admin_token',
      tests: [T.status(400)],
    }),
    req({
      name: 'Nhập actual_quantity Cho Toàn Bộ Dòng (PATCH)',
      method: 'PATCH',
      path: '/api/stocktake-sessions/{{stocktake_id}}/items',
      token: 'admin_token',
      body: '{{stocktake_patch_body}}',
      tests: [T.status(200)],
    }),
    req({
      name: 'Confirm Stocktake Session',
      method: 'POST',
      path: '/api/stocktake-sessions/{{stocktake_id}}/confirm',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
    req({
      name: 'Verify Inventory SET = actual_quantity (55 - 5 = 50)',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("quantity = 50 sau kiểm kê", () => pm.expect(pm.response.json().data[0].quantity).to.eql(50));`],
    }),
    req({ name: 'List Stocktake Sessions', method: 'GET', path: '/api/stocktake-sessions', token: 'admin_token', tests: [T.status(200)] }),
  ],
});

// ═══════════════════════ 15. Liquidation Orders ═══════════════════════
items.push({
  name: '15 - Liquidation Orders (E6)',
  item: [
    req({
      name: 'RBAC: staff Create Liquidation -> 403',
      method: 'POST',
      path: '/api/liquidation-orders',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 1 }] },
      tests: [T.status(403)],
    }),
    req({
      name: 'Create Liquidation Order (10 đơn vị)',
      method: 'POST',
      path: '/api/liquidation-orders',
      token: 'admin_token',
      body: { warehouse_id: '{{warehouse_id}}', reason: 'hỏng hóc', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 10 }] },
      tests: [T.status(201), T.saveFromData('liquidation_id', 'liquidation_id')],
    }),
    req({
      name: 'Confirm Liquidation Order',
      method: 'POST',
      path: '/api/liquidation-orders/{{liquidation_id}}/confirm',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("approver đúng người confirm", () => pm.expect(pm.response.json().data.approver.email).to.include("warehouse.local"));`],
    }),
    req({
      name: 'Verify Tồn Kho Giảm (50 -> 40)',
      method: 'GET',
      path: '/api/inventory?item_id={{item_id}}&location_id={{location_id}}',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("quantity = 40", () => pm.expect(pm.response.json().data[0].quantity).to.eql(40));`],
    }),
    req({
      name: 'Create Liquidation THIẾU HÀNG (999999)',
      method: 'POST',
      path: '/api/liquidation-orders',
      token: 'admin_token',
      body: { warehouse_id: '{{warehouse_id}}', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 999999 }] },
      tests: [T.status(201), T.saveFromData('liquidation_id_insufficient', 'liquidation_id')],
    }),
    req({
      name: 'Confirm Liquidation THIẾU HÀNG -> 400',
      method: 'POST',
      path: '/api/liquidation-orders/{{liquidation_id_insufficient}}/confirm',
      token: 'admin_token',
      tests: [T.status(400)],
    }),
    req({ name: 'List Liquidation Orders', method: 'GET', path: '/api/liquidation-orders', token: 'admin_token', tests: [T.status(200)] }),
  ],
});

// ═══════════════════════ 16. Stock Movements ═══════════════════════
items.push({
  name: '16 - Stock Movements (E7)',
  item: [
    req({
      name: 'Lọc theo item_id -> đủ các loại movement_type đã phát sinh',
      method: 'GET',
      path: '/api/stock-movements?item_id={{item_id}}',
      token: 'viewer_token',
      tests: [
        T.status(200),
        `const types = new Set(pm.response.json().data.map(m => m.movement_type));`,
        `pm.test("có IMPORT/EXPORT/TRANSFER_OUT/TRANSFER_IN/RECOVERY/ADJUSTMENT_STOCKTAKE/LIQUIDATION", () => {`,
        `  ["IMPORT","EXPORT","TRANSFER_OUT","TRANSFER_IN","RECOVERY","ADJUSTMENT_STOCKTAKE","LIQUIDATION"].forEach(t => pm.expect(types.has(t)).to.be.true);`,
        `});`,
      ],
    }),
    req({
      name: 'Lọc theo movement_type=IMPORT',
      method: 'GET',
      path: '/api/stock-movements?item_id={{item_id}}&movement_type=IMPORT',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("chỉ IMPORT", () => pm.expect(pm.response.json().data.every(m => m.movement_type === "IMPORT")).to.be.true);`],
    }),
    req({
      name: 'Lọc theo reference_type=TRANSFER_ORDER -> 2 dòng',
      method: 'GET',
      path: '/api/stock-movements?item_id={{item_id}}&reference_type=TRANSFER_ORDER',
      token: 'admin_token',
      tests: [T.status(200), `pm.test("2 dòng OUT+IN", () => pm.expect(pm.response.json().data.length).to.eql(2));`],
    }),
    req({
      name: 'Lọc theo warehouse_id',
      method: 'GET',
      path: '/api/stock-movements?warehouse_id={{warehouse_id}}',
      token: 'admin_token',
      tests: [T.status(200)],
    }),
  ],
});

// ═══════════════════════ 17. AI ═══════════════════════
items.push({
  name: '17 - AI (F1-F2)',
  item: [
    req({
      name: 'POST /api/ai/detect (upload ảnh giả, MOCK)',
      method: 'POST',
      path: '/api/ai/detect',
      token: 'staff_token',
      formdata: [{ key: 'image', type: 'file', src: 'fixtures/fake-image.jpg' }],
      tests: [
        T.status(200),
        `const data = pm.response.json().data;`,
        `pm.test("có detections/summary/annotated_image đúng cấu trúc", () => {`,
        `  pm.expect(Array.isArray(data.detections)).to.be.true;`,
        `  pm.expect(Array.isArray(data.summary)).to.be.true;`,
        `  pm.expect(data.annotated_image.startsWith("data:image/")).to.be.true;`,
        `});`,
      ],
    }),
    req({
      name: 'POST /api/ai/detect không có file -> 400',
      method: 'POST',
      path: '/api/ai/detect',
      token: 'staff_token',
      tests: [T.status(400)],
    }),
    req({
      name: 'POST /api/import-orders/from-ai -> CONFIRMED ngay',
      method: 'POST',
      path: '/api/import-orders/from-ai',
      token: 'staff_token',
      body: { warehouse_id: '{{warehouse_id}}', supplier_id: '{{supplier_id}}', note: 'từ kết quả AI đã xác nhận', items: [{ item_id: '{{item_id}}', location_id: '{{location_id}}', quantity: 7 }] },
      tests: [T.status(201), `pm.test("status CONFIRMED ngay", () => pm.expect(pm.response.json().data.status).to.eql("CONFIRMED"));`],
    }),
  ],
});

const collection = {
  info: {
    name: 'Warehouse Backend API',
    description: 'Postman collection day du toan bo API backend He thong Quan ly Kho (Giai doan A-F). Chay tuan tu tu tren xuong, dung collection variables de truyen id/token giua cac request.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: items,
  variable: [
    { key: 'base_url', value: 'http://localhost:5000' },
    { key: 'admin_token', value: '' },
    { key: 'manager_token', value: '' },
    { key: 'staff_token', value: '' },
    { key: 'viewer_token', value: '' },
    { key: 'manager_email', value: '' },
    { key: 'staff_email', value: '' },
    { key: 'viewer_email', value: '' },
    { key: 'todelete_email', value: '' },
    { key: 'role_id_manager', value: '' },
    { key: 'role_id_staff', value: '' },
    { key: 'role_id_viewer', value: '' },
    { key: 'role_id_to_delete', value: '' },
    { key: 'user_id_manager', value: '' },
    { key: 'user_id_staff', value: '' },
    { key: 'user_id_viewer', value: '' },
    { key: 'user_id_to_delete', value: '' },
    { key: 'category_id', value: '' },
    { key: 'category_id_to_delete', value: '' },
    { key: 'item_id', value: '' },
    { key: 'item_id_to_delete', value: '' },
    { key: 'warehouse_id', value: '' },
    { key: 'warehouse_id_to_delete', value: '' },
    { key: 'location_id', value: '' },
    { key: 'location_id_b', value: '' },
    { key: 'location_id_to_delete', value: '' },
    { key: 'supplier_id', value: '' },
    { key: 'supplier_id_to_delete', value: '' },
    { key: 'import_id', value: '' },
    { key: 'export_id', value: '' },
    { key: 'export_id_insufficient', value: '' },
    { key: 'transfer_id', value: '' },
    { key: 'recovery_id', value: '' },
    { key: 'stocktake_id', value: '' },
    { key: 'stocktake_patch_body', value: '' },
    { key: 'liquidation_id', value: '' },
    { key: 'liquidation_id_insufficient', value: '' },
    { key: 'inventory_qty_before_export', value: '' },
    { key: 'inventory_qty_before_fail', value: '' },
  ],
};

const outPath = path.join(__dirname, 'warehouse-backend.postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));

let requestCount = 0;
for (const folder of items) requestCount += folder.item.length;
console.log(`Đã sinh ${outPath}`);
console.log(`Số folder: ${items.length} | Số request: ${requestCount}`);
