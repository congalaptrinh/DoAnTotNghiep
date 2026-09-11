const router = require('express').Router();

const ctrl = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ALL_ROLES } = require('../utils/roles');

router.use(authenticate, authorize(...ALL_ROLES));

router.get('/', ctrl.list);
router.get('/:itemId', ctrl.getByItemId);

module.exports = router;
