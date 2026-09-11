const crypto = require('crypto');

function generateCode(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `${prefix}-${datePart}-${randomPart}`;
}

module.exports = { generateCode };
