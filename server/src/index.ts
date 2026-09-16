import { createApp } from './app';
import { defaultStore } from './db/store';
import { seedDatabase } from './seed';
import { config } from './config';

async function startServer() {
  try {
    await defaultStore.init();

    // Auto-seed if no users exist
    const users = await defaultStore.listUsers();
    if (users.length === 0) {
      console.log('Seeding initial non-production demo data...');
      await seedDatabase(defaultStore);
    }

    const app = createApp(defaultStore);
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`Project Cyber Heist API running on http://0.0.0.0:${config.port}`);
      console.log(`Healthcheck endpoint ready at http://127.0.0.1:${config.port}/health`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        await defaultStore.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { startServer };
