import request from 'supertest';
import { app } from '../src/app';

describe('admin user routes', () => {
  it('requires an authenticated administrator to list users', async () => {
    const response = await request(app).get('/api/admin/users');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Autenticação necessária.');
  });
});
