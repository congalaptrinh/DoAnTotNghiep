require('dotenv').config();

const app = require('./app');
const prisma = require('./utils/prisma');

const PORT = process.env.PORT || 5000;

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
