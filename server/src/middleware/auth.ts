import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    console.warn('[auth] requireAdmin: no Bearer token —', req.method, req.path);
    req.resume(); // drain body so Node doesn't reset the TCP connection
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch (err) {
    console.warn('[auth] requireAdmin: invalid/expired token —', req.method, req.path, String(err));
    req.resume();
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
