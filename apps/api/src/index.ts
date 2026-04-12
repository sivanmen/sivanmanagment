import { config } from './config';
import app from './app';
import { prisma } from './prisma/client';
import { initRedis, disconnectRedis } from './lib/redis';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('[DB] Database connected successfully');

    // Initialize Redis (non-blocking — app works without it)
    await initRedis();

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║  Sivan Management PMS API                    ║
║  Environment: ${config.env.padEnd(30)}║
║  Port: ${String(config.port).padEnd(37)}║
║  Health: http://localhost:${config.port}/api/v1/health  ║
║  Deep:   http://localhost:${config.port}/api/v1/health/deep
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  await disconnectRedis();
  await prisma.$disconnect();
  console.log('All connections closed. Goodbye.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

main();
