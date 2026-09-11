const { z } = require('zod');

const recoveryOrderItemSchema = z.object({
  item_id: z.string().uuid('item_id không hợp lệ'),
  location_id: z.string().uuid('location_id không hợp lệ'),
  quantity: z.number().int().positive('quantity phải lớn hơn 0'),
  note: z.string().optional(),
});

const createRecoveryOrderSchema = z.object({
  warehouse_id: z.string().uuid('warehouse_id không hợp lệ'),
  recovery_date: z.coerce.date().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
  items: z.array(recoveryOrderItemSchema).min(1, 'Phiếu thu hồi phải có ít nhất 1 dòng vật tư'),
});

module.exports = { createRecoveryOrderSchema };
