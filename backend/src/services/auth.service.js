const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

function stripPassword(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Tài khoản đã bị khóa');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return { token, user: stripPassword(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  return stripPassword(user);
}

module.exports = { login, getMe };
