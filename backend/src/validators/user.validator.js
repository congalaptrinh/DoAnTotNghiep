const { z } = require('zod');

const createUserSchema = z.object({
  full_name: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  phone: z.string().optional(),
  role_id: z.string().uuid('role_id không hợp lệ'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const updateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').optional(),
  phone: z.string().optional(),
  role_id: z.string().uuid('role_id không hợp lệ').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

module.exports = { createUserSchema, updateUserSchema };
