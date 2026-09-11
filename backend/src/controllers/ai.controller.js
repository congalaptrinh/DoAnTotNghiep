const aiService = require('../services/ai.service');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');

// MOCK — xem ghi chú đầy đủ trong src/services/ai.service.js.
async function detect(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'Vui lòng chọn ảnh để nhận diện (field "image")');
  }

  const result = await aiService.detect(req.file.buffer, req.file.mimetype);
  success(res, result, 'Nhận diện thành công (MOCK — chưa tích hợp AI Service thật)');
}

module.exports = { detect };
