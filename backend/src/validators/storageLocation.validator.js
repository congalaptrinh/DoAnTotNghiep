const { z } = require('zod');

const createStorageLocationSchema = z.object({
  warehouse_id: z.string().uuid('warehouse_id không hợp lệ'),
  location_code: z.string().min(1, 'Mã vị trí không được để trống'),
  location_name: z.string().optional(),
  area: z.string().optional(),
  shelf: z.string().optional(),
  drawer: z.string().optional(),
  box: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const updateStorageLocationSchema = createStorageLocationSchema.partial();

module.exports = { createStorageLocationSchema, updateStorageLocationSchema };
