const { z } = require('zod');

const importOrderItemSchema = z.object({
  item_id: z.string().uuid('item_id không hợp lệ'),
  location_id: z.string().uuid('location_id không hợp lệ'),
  quantity: z.number().int().positive('quantity phải lớn hơn 0'),
  unit_price: z.number().nonnegative().optional(),
  batch_number: z.string().optional(),
  note: z.string().optional(),
});

const createImportOrderSchema = z.object({
  supplier_id: z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid('warehouse_id không hợp lệ'),
  import_date: z.coerce.date().optional(),
  note: z.string().optional(),
  items: z.array(importOrderItemSchema).min(1, 'Phiếu nhập phải có ít nhất 1 dòng vật tư'),
});

module.exports = { createImportOrderSchema };
