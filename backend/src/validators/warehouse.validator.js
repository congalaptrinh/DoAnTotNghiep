const { z } = require('zod');

const createWarehouseSchema = z.object({
  warehouse_name: z.string().min(1, 'Tên kho không được để trống'),
  address: z.string().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const updateWarehouseSchema = createWarehouseSchema.partial();

module.exports = { createWarehouseSchema, updateWarehouseSchema };
