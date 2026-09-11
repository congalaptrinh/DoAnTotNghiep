const { z } = require('zod');

const createRoleSchema = z.object({
  role_name: z.string().min(1, 'Tên vai trò không được để trống'),
  description: z.string().optional(),
});

const updateRoleSchema = createRoleSchema.partial();

module.exports = { createRoleSchema, updateRoleSchema };
