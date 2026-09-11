const { fail } = require('../utils/response');

function notFoundHandler(req, res) {
  return fail(res, `Không tìm thấy route: ${req.method} ${req.originalUrl}`, 404);
}

module.exports = notFoundHandler;
