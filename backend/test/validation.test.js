import test from 'node:test';
import assert from 'node:assert/strict';
import { inquirySchema, loginSchema, statusSchema } from '../src/validation.js';

test('accepts a complete public inquiry', () => {
  const result = inquirySchema.safeParse({
    userType: 'Parent',
    category: 'Admission',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '+91 98765 43210',
    message: 'I would like to learn about admissions.',
  });

  assert.equal(result.success, true);
});

test('rejects invalid inquiry categories and malformed contact details', () => {
  const result = inquirySchema.safeParse({
    userType: 'Other',
    category: 'Financial aid',
    name: 'A',
    email: 'not-an-email',
    phone: 'call me',
    message: 'Hi',
  });

  assert.equal(result.success, false);
});

test('rejects phone numbers that are too long for their country', () => {
  const result = inquirySchema.safeParse({
    userType: 'Student',
    category: 'Admission',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '+91 98765 432109',
    message: 'I would like to learn about admissions.',
  });

  assert.equal(result.success, false);
});

test('accepts valid login fields and supported status values only', () => {
  assert.equal(loginSchema.safeParse({ email: 'admin@example.com', password: 'a-secret' }).success, true);
  assert.equal(statusSchema.safeParse({ status: 'In Progress' }).success, true);
  assert.equal(statusSchema.safeParse({ status: 'Archived' }).success, false);
});
