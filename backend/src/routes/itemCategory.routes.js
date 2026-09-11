const router = require('express').Router();

const ctrl = require('../controllers/itemCategory.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ALL_ROLES, MANAGE_ROLES } = require('../utils/roles');

router.use(authenticate);

router.get('/', authorize(...ALL_ROLES), ctrl.list);
router.get('/:id', authorize(...ALL_ROLES), ctrl.getById);
router.post('/', authorize(...MANAGE_ROLES), ctrl.create);
router.put('/:id', authorize(...MANAGE_ROLES), ctrl.update);
router.delete('/:id', authorize(...MANAGE_ROLES), ctrl.remove);

module.exports = router;
