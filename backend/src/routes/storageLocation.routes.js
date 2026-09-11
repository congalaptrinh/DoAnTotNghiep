const router = require('express').Router();

const ctrl = require('../controllers/storageLocation.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ALL_ROLES, STAFF_WRITE_ROLES } = require('../utils/roles');

router.use(authenticate);

router.get('/', authorize(...ALL_ROLES), ctrl.list);
router.get('/:id', authorize(...ALL_ROLES), ctrl.getById);
router.post('/', authorize(...STAFF_WRITE_ROLES), ctrl.create);
router.put('/:id', authorize(...STAFF_WRITE_ROLES), ctrl.update);
router.delete('/:id', authorize(...STAFF_WRITE_ROLES), ctrl.remove);

module.exports = router;
