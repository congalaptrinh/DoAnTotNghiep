const router = require('express').Router();

const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ADMIN_ONLY } = require('../utils/roles');

router.use(authenticate, authorize(...ADMIN_ONLY));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
