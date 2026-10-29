import jwt from 'jsonwebtoken';
import { pool } from './db.js';

export async function requireAdmin(req, res, next) {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const result = await pool.query(
      'SELECT id, email FROM admins WHERE id = $1',
      [payload.sub],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    req.admin = result.rows[0];
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    return next(error);
  }
}
