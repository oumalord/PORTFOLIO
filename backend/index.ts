import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import { Pool } from 'pg';

const app = express();
const port = Number(process.env.PORT || 3001);
const adminPassword = process.env.ADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET || adminPassword;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
const allowedTypes: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};
const cookieName = 'portfolio_admin';
const sessionDurationSeconds = 7 * 24 * 60 * 60;

type AsyncHandler = express.RequestHandler;

const asyncHandler =
  (handler: AsyncHandler): express.RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

function requireDatabase(
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!pool) {
    res.status(503).json({ error: 'DATABASE_URL is not configured on the server.' });
    return;
  }
  next();
}

function safeEqual(left: string, right: string): boolean {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function signSession(expiration: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expiration })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret!).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function isAdmin(req: express.Request): boolean {
  if (!sessionSecret) {
    return false;
  }
  const cookies = req.headers.cookie?.split(';') ?? [];
  const cookie = cookies
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  const token = cookie?.slice(cookieName.length + 1);
  if (!token) {
    return false;
  }
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
  if (!safeEqual(signature, expected)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number };
    return typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Sign in to manage this site.' });
    return;
  }
  next();
}

function collectPaths(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    if (value.startsWith('img/')) {
      out.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPaths(item, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectPaths(item, out));
  }
}

app.use(express.json({ limit: '7mb' }));

app.get('/api/_healthcheck', asyncHandler(async (_req, res) => {
  let database = false;
  if (pool) {
    await pool.query('SELECT 1');
    database = true;
  }
  res.json({
    message: 'Success',
    database,
    adminConfigured: Boolean(adminPassword),
  });
}));

app.get('/api/site', requireDatabase, asyncHandler(async (_req, res) => {
  const result = await pool!.query<{ content: unknown }>(
    'SELECT content FROM portfolio_content WHERE id = 1'
  );
  const content = result.rows[0]?.content ?? null;
  const paths = new Set<string>();
  collectPaths(content, paths);
  const urls: Record<string, string> = {};
  if (paths.size > 0) {
    const media = await pool!.query<{ path: string }>(
      'SELECT path FROM portfolio_media WHERE path = ANY($1::text[])',
      [Array.from(paths)]
    );
    for (const row of media.rows) {
      urls[row.path] = `/api/media/${row.path}`;
    }
  }
  res.json({ content, urls });
}));

app.get('/api/media/*', requireDatabase, asyncHandler(async (req, res) => {
  const path = req.params[0];
  const result = await pool!.query<{ content: Buffer; content_type: string }>(
    'SELECT content, content_type FROM portfolio_media WHERE path = $1',
    [path]
  );
  const media = result.rows[0];
  if (!media) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }
  res.type(media.content_type).set('Cache-Control', 'public, max-age=3600').send(media.content);
}));

app.post('/api/admin/login', (req, res) => {
  if (!adminPassword || !sessionSecret) {
    res.status(503).json({ error: 'Set ADMIN_PASSWORD (and optionally SESSION_SECRET) in the server environment.' });
    return;
  }
  const password = req.body?.password;
  if (typeof password !== 'string' || !safeEqual(password, adminPassword)) {
    res.status(401).json({ error: 'Incorrect admin password.' });
    return;
  }
  const token = signSession(Date.now() + sessionDurationSeconds * 1000);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res
    .set(
      'Set-Cookie',
      `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${secure}`
    )
    .json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  res.set('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`).json({ ok: true });
});

app.get('/api/admin/status', (req, res) => {
  res.json({ isOwner: isAdmin(req) });
});

app.put(
  '/api/admin/site',
  requireAdmin,
  requireDatabase,
  asyncHandler(async (req, res) => {
    const content = req.body?.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      res.status(400).json({ error: 'Invalid content.' });
      return;
    }
    if (JSON.stringify(content).length > 200000) {
      res.status(413).json({ error: 'Content is too large.' });
      return;
    }

    const client = await pool!.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO portfolio_content (id, content, updated_at)
         VALUES (1, $1::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
        [JSON.stringify(content)]
      );
      const used = new Set<string>();
      collectPaths(content, used);
      await client.query(
        'DELETE FROM portfolio_media WHERE path LIKE $1 AND NOT (path = ANY($2::text[]))',
        ['img/%', Array.from(used)]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  })
);

app.post(
  '/api/admin/image',
  requireAdmin,
  requireDatabase,
  asyncHandler(async (req, res) => {
    const { data, contentType } = req.body ?? {};
    if (
      typeof data !== 'string' ||
      typeof contentType !== 'string' ||
      !allowedTypes[contentType] ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)
    ) {
      res.status(400).json({ error: 'Unsupported or invalid file. Use JPG, PNG, WebP, GIF, PDF, MP4 or WebM.' });
      return;
    }
    if (data.length > 5400000) {
      res.status(413).json({ error: 'File is too large (max about 4 MB).' });
      return;
    }
    const path = `img/${Date.now().toString(36)}${crypto.randomBytes(5).toString('hex')}.${allowedTypes[contentType]}`;
    const content = Buffer.from(data, 'base64');
    await pool!.query(
      `INSERT INTO portfolio_media (path, content, content_type)
       VALUES ($1, $2, $3)`,
      [path, content, contentType]
    );
    res.json({ path, url: `/api/media/${path}` });
  })
);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API request failed:', error);
  res.status(500).json({ error: 'The server could not complete the request.' });
});

async function start(): Promise<void> {
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_content (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        content JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS portfolio_media (
        path TEXT PRIMARY KEY,
        content BYTEA NOT NULL,
        content_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Neon database connected; portfolio tables are ready.');
  } else {
    console.warn('DATABASE_URL is not set. Add it to .env to enable saved content and uploads.');
  }
  if (!adminPassword) {
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
