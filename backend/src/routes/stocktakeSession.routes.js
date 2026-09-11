const router = require('express').Router();

const ctrl = require('../controllers/stocktakeSession.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ALL_ROLES, MANAGE_ROLES } = require('../utils/roles');

router.use(authenticate);

router.get('/', authorize(...ALL_ROLES), ctrl.list);
router.get('/:id', authorize(...ALL_ROLES), ctrl.getById);
router.post('/', authorize(...MANAGE_ROLES), ctrl.create);
router.patch('/:id/items', authorize(...MANAGE_ROLES), ctrl.updateItems);
router.post('/:id/confirm', authorize(...MANAGE_ROLES), ctrl.confirm);

module.exports = router;
