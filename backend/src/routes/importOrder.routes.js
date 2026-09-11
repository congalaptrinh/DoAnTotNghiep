const router = require('express').Router();

const ctrl = require('../controllers/importOrder.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ALL_ROLES, STAFF_WRITE_ROLES } = require('../utils/roles');

router.use(authenticate);

router.get('/', authorize(...ALL_ROLES), ctrl.list);
router.get('/:id', authorize(...ALL_ROLES), ctrl.getById);
router.post('/', authorize(...STAFF_WRITE_ROLES), ctrl.create);
router.post('/from-ai', authorize(...STAFF_WRITE_ROLES), ctrl.createFromAi);
router.post('/:id/confirm', authorize(...STAFF_WRITE_ROLES), ctrl.confirm);

module.exports = router;
