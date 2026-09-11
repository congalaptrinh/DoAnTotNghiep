const { z } = require('zod');

const exportOrderItemSchema = z.object({
  item_id: z.string().uuid('item_id không hợp lệ'),
  location_id: z.string().uuid('location_id không hợp lệ'),
  quantity: z.number().int().positive('quantity phải lớn hơn 0'),
  note: z.string().optional(),
});

const createExportOrderSchema = z.object({
  warehouse_id: z.string().uuid('warehouse_id không hợp lệ'),
  export_date: z.coerce.date().optional(),
  purpose: z.string().optional(),
  project_name: z.string().optional(),
  note: z.string().optional(),
  items: z.array(exportOrderItemSchema).min(1, 'Phiếu xuất phải có ít nhất 1 dòng vật tư'),
});

module.exports = { createExportOrderSchema };
