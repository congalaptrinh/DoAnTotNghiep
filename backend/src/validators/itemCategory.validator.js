const { z } = require('zod');

const createItemCategorySchema = z.object({
  category_name: z.string().min(1, 'Tên danh mục không được để trống'),
  parent_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
});

const updateItemCategorySchema = createItemCategorySchema.partial();

module.exports = { createItemCategorySchema, updateItemCategorySchema };
