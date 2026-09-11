-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IMPORT', 'EXPORT', 'TRANSFER_IN', 'TRANSFER_OUT', 'RECOVERY', 'ADJUSTMENT_STOCKTAKE', 'LIQUIDATION');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('IMPORT_ORDER', 'EXPORT_ORDER', 'TRANSFER_ORDER', 'RECOVERY_ORDER', 'STOCKTAKE_SESSION', 'LIQUIDATION_ORDER');

-- CreateTable
CREATE TABLE "roles" (
    "role_id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "role_id" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "item_categories" (
    "category_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "parent_id" TEXT,
    "description" TEXT,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "items" (
    "item_id" TEXT NOT NULL,
    "item_code" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_type" TEXT,
    "category_id" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "specifications" TEXT,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "max_stock" INTEGER,
    "image_url" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "warehouse_id" TEXT NOT NULL,
    "warehouse_name" TEXT NOT NULL,
    "address" TEXT,
    "manager_id" TEXT,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "location_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_code" TEXT NOT NULL,
    "location_name" TEXT,
    "area" TEXT,
    "shelf" TEXT,
    "drawer" TEXT,
    "box" TEXT,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "available_quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "import_orders" (
    "import_id" TEXT NOT NULL,
    "import_code" TEXT NOT NULL,
    "supplier_id" TEXT,
    "warehouse_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "import_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_orders_pkey" PRIMARY KEY ("import_id")
);

-- CreateTable
CREATE TABLE "import_order_items" (
    "import_item_id" TEXT NOT NULL,
    "import_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(14,2),
    "batch_number" TEXT,
    "note" TEXT,

    CONSTRAINT "import_order_items_pkey" PRIMARY KEY ("import_item_id")
);

-- CreateTable
CREATE TABLE "export_orders" (
    "export_id" TEXT NOT NULL,
    "export_code" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "export_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "project_name" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_orders_pkey" PRIMARY KEY ("export_id")
);

-- CreateTable
CREATE TABLE "export_order_items" (
    "export_item_id" TEXT NOT NULL,
    "export_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "export_order_items_pkey" PRIMARY KEY ("export_item_id")
);

-- CreateTable
CREATE TABLE "transfer_orders" (
    "transfer_id" TEXT NOT NULL,
    "transfer_code" TEXT NOT NULL,
    "from_warehouse_id" TEXT NOT NULL,
    "to_warehouse_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_orders_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateTable
CREATE TABLE "transfer_order_items" (
    "transfer_item_id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "from_location_id" TEXT NOT NULL,
    "to_location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "transfer_order_items_pkey" PRIMARY KEY ("transfer_item_id")
);

-- CreateTable
CREATE TABLE "recovery_orders" (
    "recovery_id" TEXT NOT NULL,
    "recovery_code" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "recovery_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_orders_pkey" PRIMARY KEY ("recovery_id")
);

-- CreateTable
CREATE TABLE "recovery_order_items" (
    "recovery_item_id" TEXT NOT NULL,
    "recovery_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "recovery_order_items_pkey" PRIMARY KEY ("recovery_item_id")
);

-- CreateTable
CREATE TABLE "stocktake_sessions" (
    "stocktake_id" TEXT NOT NULL,
    "stocktake_code" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "stocktake_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocktake_sessions_pkey" PRIMARY KEY ("stocktake_id")
);

-- CreateTable
CREATE TABLE "stocktake_session_items" (
    "stocktake_item_id" TEXT NOT NULL,
    "stocktake_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "system_quantity" INTEGER NOT NULL,
    "actual_quantity" INTEGER,
    "difference" INTEGER,
    "note" TEXT,

    CONSTRAINT "stocktake_session_items_pkey" PRIMARY KEY ("stocktake_item_id")
);

-- CreateTable
CREATE TABLE "liquidation_orders" (
    "liquidation_id" TEXT NOT NULL,
    "liquidation_code" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "liquidation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidation_orders_pkey" PRIMARY KEY ("liquidation_id")
);

-- CreateTable
CREATE TABLE "liquidation_order_items" (
    "liquidation_item_id" TEXT NOT NULL,
    "liquidation_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "liquidation_order_items_pkey" PRIMARY KEY ("liquidation_item_id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "movement_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "movement_type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference_type" "ReferenceType" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "movement_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("movement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "item_categories_parent_id_idx" ON "item_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_item_code_key" ON "items"("item_code");

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "items"("category_id");

-- CreateIndex
CREATE INDEX "warehouses_manager_id_idx" ON "warehouses"("manager_id");

-- CreateIndex
CREATE INDEX "storage_locations_warehouse_id_idx" ON "storage_locations"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_warehouse_id_location_code_key" ON "storage_locations"("warehouse_id", "location_code");

-- CreateIndex
CREATE INDEX "inventory_warehouse_id_idx" ON "inventory"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_location_id_idx" ON "inventory"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_id_warehouse_id_location_id_key" ON "inventory"("item_id", "warehouse_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_orders_import_code_key" ON "import_orders"("import_code");

-- CreateIndex
CREATE INDEX "import_orders_warehouse_id_idx" ON "import_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "import_orders_supplier_id_idx" ON "import_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "import_order_items_import_id_idx" ON "import_order_items"("import_id");

-- CreateIndex
CREATE INDEX "import_order_items_item_id_idx" ON "import_order_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "export_orders_export_code_key" ON "export_orders"("export_code");

-- CreateIndex
CREATE INDEX "export_orders_warehouse_id_idx" ON "export_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "export_order_items_export_id_idx" ON "export_order_items"("export_id");

-- CreateIndex
CREATE INDEX "export_order_items_item_id_idx" ON "export_order_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_orders_transfer_code_key" ON "transfer_orders"("transfer_code");

-- CreateIndex
CREATE INDEX "transfer_orders_from_warehouse_id_idx" ON "transfer_orders"("from_warehouse_id");

-- CreateIndex
CREATE INDEX "transfer_orders_to_warehouse_id_idx" ON "transfer_orders"("to_warehouse_id");

-- CreateIndex
CREATE INDEX "transfer_order_items_transfer_id_idx" ON "transfer_order_items"("transfer_id");

-- CreateIndex
CREATE INDEX "transfer_order_items_item_id_idx" ON "transfer_order_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_orders_recovery_code_key" ON "recovery_orders"("recovery_code");

-- CreateIndex
CREATE INDEX "recovery_orders_warehouse_id_idx" ON "recovery_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "recovery_order_items_recovery_id_idx" ON "recovery_order_items"("recovery_id");

-- CreateIndex
CREATE INDEX "recovery_order_items_item_id_idx" ON "recovery_order_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocktake_sessions_stocktake_code_key" ON "stocktake_sessions"("stocktake_code");

-- CreateIndex
CREATE INDEX "stocktake_sessions_warehouse_id_idx" ON "stocktake_sessions"("warehouse_id");

-- CreateIndex
CREATE INDEX "stocktake_session_items_stocktake_id_idx" ON "stocktake_session_items"("stocktake_id");

-- CreateIndex
CREATE INDEX "stocktake_session_items_item_id_idx" ON "stocktake_session_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "liquidation_orders_liquidation_code_key" ON "liquidation_orders"("liquidation_code");

-- CreateIndex
CREATE INDEX "liquidation_orders_warehouse_id_idx" ON "liquidation_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "liquidation_order_items_liquidation_id_idx" ON "liquidation_order_items"("liquidation_id");

-- CreateIndex
CREATE INDEX "liquidation_order_items_item_id_idx" ON "liquidation_order_items"("item_id");

-- CreateIndex
CREATE INDEX "stock_movements_item_id_idx" ON "stock_movements"("item_id");

-- CreateIndex
CREATE INDEX "stock_movements_warehouse_id_idx" ON "stock_movements"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_reference_type_reference_id_idx" ON "stock_movements"("reference_type", "reference_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "item_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_order_items" ADD CONSTRAINT "import_order_items_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import_orders"("import_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_order_items" ADD CONSTRAINT "import_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_order_items" ADD CONSTRAINT "import_order_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_export_id_fkey" FOREIGN KEY ("export_id") REFERENCES "export_orders"("export_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfer_orders"("transfer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_items" ADD CONSTRAINT "transfer_order_items_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_orders" ADD CONSTRAINT "recovery_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_orders" ADD CONSTRAINT "recovery_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_order_items" ADD CONSTRAINT "recovery_order_items_recovery_id_fkey" FOREIGN KEY ("recovery_id") REFERENCES "recovery_orders"("recovery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_order_items" ADD CONSTRAINT "recovery_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_order_items" ADD CONSTRAINT "recovery_order_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_sessions" ADD CONSTRAINT "stocktake_sessions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_sessions" ADD CONSTRAINT "stocktake_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_session_items" ADD CONSTRAINT "stocktake_session_items_stocktake_id_fkey" FOREIGN KEY ("stocktake_id") REFERENCES "stocktake_sessions"("stocktake_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_session_items" ADD CONSTRAINT "stocktake_session_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_session_items" ADD CONSTRAINT "stocktake_session_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_orders" ADD CONSTRAINT "liquidation_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_orders" ADD CONSTRAINT "liquidation_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_orders" ADD CONSTRAINT "liquidation_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_order_items" ADD CONSTRAINT "liquidation_order_items_liquidation_id_fkey" FOREIGN KEY ("liquidation_id") REFERENCES "liquidation_orders"("liquidation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_order_items" ADD CONSTRAINT "liquidation_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidation_order_items" ADD CONSTRAINT "liquidation_order_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
