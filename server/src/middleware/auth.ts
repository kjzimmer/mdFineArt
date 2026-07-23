import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
  isAppAdmin: boolean;
  galleryId: string;
}

declare global {
  namespace Express {
    interface Request { admin?: AdminPayload; }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.resume();
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as AdminPayload;
    if (!payload.galleryId) {
      // Old token format — force re-login
      req.resume();
      res.status(401).json({ success: false, error: 'Session expired, please log in again' });
      return;
    }
    if (!payload.isAppAdmin && payload.galleryId !== req.gallery?.id) {
      req.resume();
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    req.admin = payload;
    next();
  } catch {
    req.resume();
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
