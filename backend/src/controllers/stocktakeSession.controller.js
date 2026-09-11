const stocktakeSessionService = require('../services/stocktakeSession.service');
const {
  createStocktakeSessionSchema,
  updateStocktakeItemsSchema,
} = require('../validators/stocktakeSession.validator');
const { success } = require('../utils/response');

async function list(req, res) {
  const { warehouse_id, status } = req.query;
  success(res, await stocktakeSessionService.list({ warehouse_id, status }));
}

async function getById(req, res) {
  success(res, await stocktakeSessionService.getById(req.params.id));
}

async function create(req, res) {
  const data = createStocktakeSessionSchema.parse(req.body);
  success(res, await stocktakeSessionService.create(data, req.user.user_id), 'Tạo phiên kiểm kê thành công', 201);
}

async function updateItems(req, res) {
  const data = updateStocktakeItemsSchema.parse(req.body);
  success(res, await stocktakeSessionService.updateItems(req.params.id, data.items), 'Cập nhật số lượng thực tế thành công');
}

async function confirm(req, res) {
  success(res, await stocktakeSessionService.confirm(req.params.id, req.user.user_id), 'Xác nhận kiểm kê thành công');
}

module.exports = { list, getById, create, updateItems, confirm };
