const authService = require('../services/auth.service');
const { loginSchema } = require('../validators/auth.validator');
const { success } = require('../utils/response');

async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data.email, data.password);
  success(res, result, 'Đăng nhập thành công');
}

async function me(req, res) {
  const user = await authService.getMe(req.user.user_id);
  success(res, user);
}

module.exports = { login, me };
