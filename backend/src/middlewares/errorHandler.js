const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const { fail } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return fail(res, err.message, err.statusCode);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
      return fail(res, `Dữ liệu đã tồn tại (trùng ${target || 'giá trị duy nhất'})`, 409);
    }
    if (err.code === 'P2003') {
      return fail(res, 'Dữ liệu tham chiếu không hợp lệ hoặc đang được sử dụng bởi bản ghi khác', 409);
    }
    if (err.code === 'P2025') {
      return fail(res, 'Không tìm thấy bản ghi', 404);
    }
  }

  if (err.name === 'ZodError') {
    const message = err.issues?.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') || 'Dữ liệu không hợp lệ';
    return fail(res, message, 400);
  }

  console.error(err);
  return fail(res, 'Đã có lỗi xảy ra ở máy chủ', 500);
}

module.exports = errorHandler;
