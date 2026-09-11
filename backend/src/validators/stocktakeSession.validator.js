const { z } = require('zod');

const createStocktakeSessionSchema = z.object({
  warehouse_id: z.string().uuid('warehouse_id không hợp lệ'),
  stocktake_date: z.coerce.date().optional(),
  note: z.string().optional(),
});

const stocktakeItemUpdateSchema = z.object({
  stocktake_item_id: z.string().uuid('stocktake_item_id không hợp lệ'),
  actual_quantity: z.number().int().min(0, 'actual_quantity không được âm'),
});

const updateStocktakeItemsSchema = z.object({
  items: z.array(stocktakeItemUpdateSchema).min(1, 'Phải nhập ít nhất 1 dòng'),
});

module.exports = { createStocktakeSessionSchema, updateStocktakeItemsSchema };
