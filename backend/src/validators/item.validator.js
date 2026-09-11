const { z } = require('zod');

const createItemSchema = z.object({
  item_code: z.string().min(1, 'Mã vật tư không được để trống'),
  item_name: z.string().min(1, 'Tên vật tư không được để trống'),
  item_type: z.string().optional(),
  category_id: z.string().uuid('category_id không hợp lệ'),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  description: z.string().optional(),
  specifications: z.string().optional(),
  min_stock: z.number().int().min(0).optional(),
  max_stock: z.number().int().min(0).optional(),
  image_url: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const updateItemSchema = createItemSchema.partial();

module.exports = { createItemSchema, updateItemSchema };
