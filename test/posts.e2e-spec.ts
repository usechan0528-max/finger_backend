import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { signupAndLogin } from './helpers/auth-helper';
import { createTestApp } from './helpers/test-app';

describe('Posts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('작성자가 viewer를 핑거로 지정한 경우 FINGER_ONLY 글을 볼 수 있어야 한다', async () => {
    const userA = await signupAndLogin(app, 'postA@example.com', 'post_a');
    const userB = await signupAndLogin(app, 'postB@example.com', 'post_b');

    await request(app.getHttpServer())
      .post(`/api/v1/fingers/${userB.user.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        contentText: 'secret post',
        visibilityType: 'FINGER_ONLY',
      })
      .expect(201);

    const postId = created.body.data.id;

    await request(app.getHttpServer())
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(200);
  });

  it('viewer가 작성자를 핑거로 지정했어도 반대 방향이면 볼 수 없어야 한다', async () => {
    const userC = await signupAndLogin(app, 'postC@example.com', 'post_c');
    const userD = await signupAndLogin(app, 'postD@example.com', 'post_d');

    await request(app.getHttpServer())
      .post(`/api/v1/fingers/${userC.user.id}`)
      .set('Authorization', `Bearer ${userD.accessToken}`)
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userC.accessToken}`)
      .send({
        contentText: 'direction matters',
        visibilityType: 'FINGER_ONLY',
      })
      .expect(201);

    const postId = created.body.data.id;

    await request(app.getHttpServer())
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userD.accessToken}`)
      .expect(403);
  });
});
