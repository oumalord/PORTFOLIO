import type { Request, Response } from 'express';
import { app } from './_lib/index';

export default function handler(req: Request, res: Response): void {
  const url = new URL(req.url ?? '/', 'https://portfolio.local');
  const route = url.searchParams.get('_route');
  if (!route) {
    res.status(404).json({ error: 'API route not found.' });
    return;
  }
  url.searchParams.delete('_route');
  req.url = `/api/${route}${url.search}`;
  app(req, res);
}
