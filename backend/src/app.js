const express = require('express');
const cors = require('cors');

const { success } = require('./utils/response');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const itemCategoryRoutes = require('./routes/itemCategory.routes');
const itemRoutes = require('./routes/item.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const storageLocationRoutes = require('./routes/storageLocation.routes');
const supplierRoutes = require('./routes/supplier.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const importOrderRoutes = require('./routes/importOrder.routes');
const exportOrderRoutes = require('./routes/exportOrder.routes');
const transferOrderRoutes = require('./routes/transferOrder.routes');
const recoveryOrderRoutes = require('./routes/recoveryOrder.routes');
const stocktakeSessionRoutes = require('./routes/stocktakeSession.routes');
const liquidationOrderRoutes = require('./routes/liquidationOrder.routes');
const stockMovementRoutes = require('./routes/stockMovement.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  success(res, { status: 'ok' }, 'Server is healthy');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/item-categories', itemCategoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/storage-locations', storageLocationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/import-orders', importOrderRoutes);
app.use('/api/export-orders', exportOrderRoutes);
app.use('/api/transfer-orders', transferOrderRoutes);
app.use('/api/recovery-orders', recoveryOrderRoutes);
app.use('/api/stocktake-sessions', stocktakeSessionRoutes);
app.use('/api/liquidation-orders', liquidationOrderRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
