const stockMovementService = require('../services/stockMovement.service');
const { success } = require('../utils/response');

async function list(req, res) {
  const { item_id, warehouse_id, location_id, movement_type, reference_type, from, to } = req.query;
  success(res, await stockMovementService.list({ item_id, warehouse_id, location_id, movement_type, reference_type, from, to }));
}

module.exports = { list };
