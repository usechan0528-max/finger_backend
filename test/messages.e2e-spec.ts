import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { signupAndLogin } from './helpers/auth-helper';
import { createTestApp } from './helpers/test-app';

describe('Messages (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('상호 핑거일 때만 room 생성이 가능해야 한다', async () => {
    const userA = await signupAndLogin(app, 'msgA@example.com', 'msg_a');
    const userB = await signupAndLogin(app, 'msgB@example.com', 'msg_b');

    await request(app.getHttpServer())
      .post(`/api/v1/fingers/${userB.user.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/message-rooms/${userB.user.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/fingers/${userA.user.id}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/message-rooms/${userB.user.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(201);
  });
});
