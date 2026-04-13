import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { signupAndLogin } from './helpers/auth-helper';
import { createTestApp } from './helpers/test-app';

describe('Fingers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('핑거 추가가 되어야 한다', async () => {
    const userA = await signupAndLogin(app, 'fingerA@example.com', 'finger_a');
    const userB = await signupAndLogin(app, 'fingerB@example.com', 'finger_b');

    const response = await request(app.getHttpServer())
      .post(`/api/v1/fingers/${userB.user.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(201);

    expect(response.body.success).toBe(true);
  });

  it('자기 자신은 핑거로 추가할 수 없어야 한다', async () => {
    const user = await signupAndLogin(app, 'self@example.com', 'self_user');

    await request(app.getHttpServer())
      .post(`/api/v1/fingers/${user.user.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(400);
  });
});
