import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp({
  corsOrigins: ['http://localhost:5173'],
  trustProxy: false
});

describe('application shell', () => {
  it('serves the health check at both the root and the api prefix', async () => {
    for (const path of ['/health', '/api/health']) {
      const response = await request(app).get(path).expect(200);
      expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
    }
  });

  it('sets the baseline security headers', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects unknown routes under the api prefix with a safe 404', async () => {
    const response = await request(app).get('/api/missing').expect(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route not found'
    });
  });

  it('rejects malformed JSON with a validation error', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(response.body.success).toBe(false);
    expect(JSON.stringify(response.body)).not.toContain('at Object');
  });

  it('guards every private route behind authentication', async () => {
    const id = '507f1f77bcf86cd799439011';
    const probes = [
      ['get', '/api/resumes'],
      ['post', '/api/resumes/upload'],
      ['get', '/api/analysis'],
      ['post', '/api/analysis'],
      ['get', '/api/analysis/latest'],
      ['post', '/api/analysis/compare'],
      ['post', `/api/analysis/${id}`],
      ['get', `/api/analysis/${id}`],
      ['get', '/api/jobs'],
      ['post', `/api/jobs/${id}/analyze`],
      ['get', '/api/matches'],
      ['post', `/api/jobs/${id}/match/${id}`],
      ['get', '/api/dashboard'],
      ['get', '/api/dashboard/stats'],
      ['get', '/api/settings'],
      ['patch', '/api/settings'],
      ['put', '/api/settings/password'],
      ['get', '/api/auth/me']
    ];
    for (const [method, path] of probes) {
      const response = await request(app)[method](path).expect(401);
      expect(response.body.success).toBe(false);
    }
  });
});
