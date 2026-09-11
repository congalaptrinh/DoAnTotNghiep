const inventoryService = require('../services/inventory.service');
const { success } = require('../utils/response');

async function list(req, res) {
  const { item_id, warehouse_id, location_id } = req.query;
  success(res, await inventoryService.list({ item_id, warehouse_id, location_id }));
}

async function getByItemId(req, res) {
  const { warehouse_id } = req.query;
  success(res, await inventoryService.getByItemId(req.params.itemId, { warehouse_id }));
}

module.exports = { list, getByItemId };
