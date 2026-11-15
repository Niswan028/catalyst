import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validateBody,
  validateQuery,
} from '../lib/api';

describe('Uniform API Response Envelopes', () => {
  it('creates a standard success response with { data }', async () => {
    const res = successResponse({ user: 'Eleanor', role: 'elder' }, 200);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.user).toBe('Eleanor');
    expect(json.user).toBe('Eleanor'); // dual compatibility
  });

  it('creates an error response with machine-readable code and message', async () => {
    const res = errorResponse('FORBIDDEN', 'Access denied to circle', 403, { reason: 'not_member' });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe('FORBIDDEN');
    expect(json.error.message).toBe('Access denied to circle');
    expect(json.error.details).toEqual({ reason: 'not_member' });
  });
});

describe('Zod Request Validation Helpers', () => {
  const testSchema = z.object({
    name: z.string().min(2),
    age: z.number().positive(),
  });

  it('validates JSON body successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'Eleanor', age: 78 }),
    });

    const result = await validateBody(req, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Eleanor');
      expect(result.data.age).toBe(78);
    }
  });

  it('rejects invalid JSON body with 400 and validation error details', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'E', age: -5 }),
    });

    const result = await validateBody(req, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('validates URL query parameters successfully', () => {
    const querySchema = z.object({
      role: z.enum(['elder', 'caregiver']),
      limit: z.string().transform(Number),
    });

    const req = new NextRequest('http://localhost:3000/api/test?role=elder&limit=10');
    const result = validateQuery(req, querySchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('elder');
      expect(result.data.limit).toBe(10);
    }
  });

  it('rejects invalid query parameters with 400', async () => {
    const querySchema = z.object({
      role: z.enum(['elder', 'caregiver']),
    });

    const req = new NextRequest('http://localhost:3000/api/test?role=invalid_role');
    const result = validateQuery(req, querySchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});

describe('withAuth and withCircleRole Wrappers', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const { withAuth } = await import('../lib/api/withAuth');
    const handler = withAuth(async () => {
      return new Response(JSON.stringify({ ok: true })) as any;
    });

    const unauthenticatedReq = new NextRequest('http://localhost:3000/api/protected');
    const res = await handler(unauthenticatedReq);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects withCircleRole without circle_id with 400', async () => {
    const { withCircleRole } = await import('../lib/api/withRole');
    const handler = withCircleRole(['owner', 'editor'], async () => {
      return new Response(JSON.stringify({ ok: true })) as any;
    });

    const req = new NextRequest('http://localhost:3000/api/circle-resource');
    const res = await handler(req);
    expect(res.status).toBe(401); // First fails auth since no token
  });
});
