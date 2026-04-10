import { config } from './config';
import app from './app';
import { prisma } from './prisma/client';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║  Sivan Management API                        ║
║  Environment: ${config.env.padEnd(30)}║
║  Port: ${String(config.port).padEnd(37)}║
║  Health: http://localhost:${config.port}/api/v1/health  ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
