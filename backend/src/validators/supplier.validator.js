const { z } = require('zod');

const createSupplierSchema = z.object({
  supplier_name: z.string().min(1, 'Tên nhà cung cấp không được để trống'),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

module.exports = { createSupplierSchema, updateSupplierSchema };
