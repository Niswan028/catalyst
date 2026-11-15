// Tests for API routes: 401 unauthorized, 400 validation, 429 rate limit
import { describe, it, expect, vi } from 'vitest';
import { POST as signinPOST } from '@/app/api/auth/signin/route';
import { GET as medicationsGET, POST as medicationsPOST } from '@/app/api/medications/route';
import { GET as appointmentsGET, POST as appointmentsPOST } from '@/app/api/appointments/route';
import { GET as circlesGET } from '@/app/api/circles/route';
import { NextRequest } from 'next/server';

function createMockRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const reqUrl = new URL(url, 'http://localhost:3000');
  const headers = new Headers(options.headers || {});
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return new NextRequest(reqUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe('API Route Security & Validation Tests', () => {
  describe('/api/auth/signin', () => {
    it('returns 400 on invalid or missing email format', async () => {
      const req = createMockRequest('/api/auth/signin', {
        method: 'POST',
        body: { email: 'not-an-email', password: 'Password123!' },
      });
      const res = await signinPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 on empty password', async () => {
      const req = createMockRequest('/api/auth/signin', {
        method: 'POST',
        body: { email: 'test@example.com', password: '' },
      });
      const res = await signinPOST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('/api/medications', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const req = createMockRequest('/api/medications', { method: 'GET' });
      const res = await medicationsGET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 when creating medication without token', async () => {
      const req = createMockRequest('/api/medications', {
        method: 'POST',
        body: { name: 'Aspirin', dosage: '100mg', time: '08:00' },
      });
      const res = await medicationsPOST(req);
      expect(res.status).toBe(401);
    });
  });

  describe('/api/appointments', () => {
    it('returns 401 on GET when unauthorized', async () => {
      const req = createMockRequest('/api/appointments', { method: 'GET' });
      const res = await appointmentsGET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 on POST when unauthorized', async () => {
      const req = createMockRequest('/api/appointments', {
        method: 'POST',
        body: { doctor_name: 'Dr. Jones', datetime: '2026-11-20T10:00:00Z' },
      });
      const res = await appointmentsPOST(req);
      expect(res.status).toBe(401);
    });
  });

  describe('/api/circles', () => {
    it('returns 401 on GET when unauthenticated', async () => {
      const req = createMockRequest('/api/circles', { method: 'GET' });
      const res = await circlesGET(req);
      expect(res.status).toBe(401);
    });
  });
});
