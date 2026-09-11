const router = require('express').Router();
const multer = require('multer');

const ctrl = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { STAFF_WRITE_ROLES } = require('../utils/roles');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/detect', authenticate, authorize(...STAFF_WRITE_ROLES), upload.single('image'), ctrl.detect);

module.exports = router;
