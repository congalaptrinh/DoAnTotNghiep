const { z } = require('zod');

const transferOrderItemSchema = z.object({
  item_id: z.string().uuid('item_id không hợp lệ'),
  from_location_id: z.string().uuid('from_location_id không hợp lệ'),
  to_location_id: z.string().uuid('to_location_id không hợp lệ'),
  quantity: z.number().int().positive('quantity phải lớn hơn 0'),
  note: z.string().optional(),
});

const createTransferOrderSchema = z.object({
  from_warehouse_id: z.string().uuid('from_warehouse_id không hợp lệ'),
  to_warehouse_id: z.string().uuid('to_warehouse_id không hợp lệ'),
  transfer_date: z.coerce.date().optional(),
  note: z.string().optional(),
  items: z.array(transferOrderItemSchema).min(1, 'Phiếu chuyển kho phải có ít nhất 1 dòng vật tư'),
});

module.exports = { createTransferOrderSchema };
