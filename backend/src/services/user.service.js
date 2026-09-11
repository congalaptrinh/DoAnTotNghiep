const bcrypt = require('bcrypt');

const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

function stripPassword(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function findRaw(id) {
  const user = await prisma.user.findUnique({ where: { user_id: id } });
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }
  return user;
}

async function list() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { created_at: 'desc' },
  });
  return users.map(stripPassword);
}

async function getById(id) {
  await findRaw(id);
  const user = await prisma.user.findUnique({ where: { user_id: id }, include: { role: true } });
  return stripPassword(user);
}

async function create(data) {
  const { password, ...rest } = data;
  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { ...rest, password_hash },
    include: { role: true },
  });
  return stripPassword(user);
}

async function update(id, data) {
  await findRaw(id);
  const { password, ...rest } = data;
  const updateData = { ...rest };
  if (password) {
    updateData.password_hash = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.update({
    where: { user_id: id },
    data: updateData,
    include: { role: true },
  });
  return stripPassword(user);
}

async function remove(id) {
  await findRaw(id);
  const user = await prisma.user.update({
    where: { user_id: id },
    data: { status: 'INACTIVE' },
    include: { role: true },
  });
  return stripPassword(user);
}

module.exports = { list, getById, create, update, remove };
