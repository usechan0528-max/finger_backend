import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './helpers/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('회원가입이 되어야 한다', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'auth1@example.com',
        username: 'auth_user_1',
        password: '12345678',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe('auth1@example.com');
  });

  it('로그인이 되어야 한다', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'auth2@example.com',
        username: 'auth_user_2',
        password: '12345678',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'auth2@example.com',
        password: '12345678',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
