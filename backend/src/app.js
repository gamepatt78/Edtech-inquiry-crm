import './config.js';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { requireAdmin } from './auth.js';
import { pool } from './db.js';
import { inquirySchema, loginSchema, statusSchema } from './validation.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters.');
}

const app = express();
const categories = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const userTypes = ['Parent', 'Student', 'School'];

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(503).json({
      status: 'error',
      error: getDatabaseErrorMessage(error),
    });
  }
});

app.post('/api/inquiries', async (req, res, next) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the inquiry fields.', details: parsed.error.issues });
  }

  const { userType, category, name, email, phone, message } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO inquiries (user_type, category, name, email, phone, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userType, category, name, email.toLowerCase(), phone, message],
    );
    return res.status(201).json({ inquiry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Enter a valid email and password.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash FROM admins WHERE email = $1',
      [parsed.data.email.toLowerCase()],
    );
    const admin = result.rows[0];
    const passwordMatches = admin
      ? await bcrypt.compare(parsed.data.password, admin.password_hash)
      : false;

    if (!admin || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { email: admin.email },
      process.env.JWT_SECRET,
      { subject: admin.id, expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
    );
    return res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/inquiries', requireAdmin, async (req, res, next) => {
  const filtersSchema = z.object({
    category: z.enum(categories).optional(),
    userType: z.enum(userTypes).optional(),
    search: z.string().trim().max(120).optional(),
  });
  const parsed = filtersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid inquiry filters.' });
  }

  const conditions = [];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    conditions.push(sql.replace('?', `$${values.length}`));
  };

  if (parsed.data.category) addFilter('category = ?', parsed.data.category);
  if (parsed.data.userType) addFilter('user_type = ?', parsed.data.userType);
  if (parsed.data.search) {
    values.push(`%${parsed.data.search.replace(/[\\%_]/g, '\\$&')}%`);
    const parameter = `$${values.length}`;
    conditions.push(`(name ILIKE ${parameter} ESCAPE '\\' OR phone ILIKE ${parameter} ESCAPE '\\')`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT id, user_type AS "userType", category, name, email, phone,
              message, status, created_at AS "createdAt"
       FROM inquiries ${where}
       ORDER BY created_at DESC`,
      values,
    );
    return res.json({ inquiries: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/inquiries/:id/status', requireAdmin, async (req, res, next) => {
  if (!z.string().uuid().safeParse(req.params.id).success) {
    return res.status(400).json({ error: 'Invalid inquiry ID.' });
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Choose a valid inquiry status.' });
  }

  try {
    const result = await pool.query(
      `UPDATE inquiries
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status`,
      [parsed.data.status, req.params.id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    return res.json({ inquiry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((error, _req, res, _next) => {
  console.error(error);
  const message = getDatabaseErrorMessage(error);
  if (message) {
    return res.status(503).json({ error: message });
  }
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

function getDatabaseErrorMessage(error) {
  if (error?.code === '42P01') {
    return 'The database tables are missing. Run schema.sql in your Supabase SQL Editor.';
  }

  if (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', '28P01', '3D000'].includes(error?.code)) {
    return 'Could not connect to the database. Check DATABASE_URL, the database password, and your Supabase project status.';
  }

  return null;
}

export default app;
