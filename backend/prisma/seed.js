const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');

const ROLES = [
  { role_name: 'admin', description: 'Quản trị hệ thống' },
  { role_name: 'warehouse_manager', description: 'Quản lý kho' },
  { role_name: 'warehouse_staff', description: 'Nhân viên kho' },
  { role_name: 'report_viewer', description: 'Người xem báo cáo' },
];

async function main() {
  const roleRecords = {};
  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: { description: role.description },
      create: role,
    });
    roleRecords[role.role_name] = record;
  }

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@warehouse.local' },
    update: {},
    create: {
      full_name: 'Administrator',
      email: 'admin@warehouse.local',
      password_hash: adminPasswordHash,
      role_id: roleRecords.admin.role_id,
      status: 'ACTIVE',
    },
  });

  console.log('Seed done: 4 roles + 1 admin user (admin@warehouse.local / Admin@123)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
