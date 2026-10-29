import { z } from 'zod';

export const inquirySchema = z.object({
  userType: z.enum(['Parent', 'Student', 'School']),
  category: z.enum(['Scholarship', 'Concert', 'Admission', 'General Query']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^[+]?[\d\s().-]{7,25}$/),
  message: z.string().trim().min(10).max(5000),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export const statusSchema = z.object({
  status: z.enum(['New', 'In Progress', 'Resolved']),
});
