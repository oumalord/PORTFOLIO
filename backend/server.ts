import 'dotenv/config';
import { app, initializeDatabase } from '../api/index';

const port = Number(process.env.PORT || 3001);

async function start(): Promise<void> {
  if (process.env.DATABASE_URL) {
    await initializeDatabase();
    console.log('Neon database connected; portfolio tables are ready.');
  } else {
    console.warn('DATABASE_URL is not set. Add it to .env to enable saved content and uploads.');
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ADMIN_PASSWORD is not set. Add it to .env to enable admin sign-in.');
  }
  app.listen(port, () => {
    console.log(`Portfolio API listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error('Could not start the portfolio API:', error);
  process.exitCode = 1;
});
