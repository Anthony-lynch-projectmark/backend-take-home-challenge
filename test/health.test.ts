import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /healthz', () => {
  it('responds with ok', async () => {
    const res = await request(createApp()).get('/healthz');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});
