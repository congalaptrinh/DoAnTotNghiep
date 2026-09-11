function success(res, data = null, message = undefined, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

function fail(res, message, statusCode = 400, data = null) {
  return res.status(statusCode).json({ success: false, data, message });
}

module.exports = { success, fail };
