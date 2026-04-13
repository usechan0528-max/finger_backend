import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { signupAndLogin } from './helpers/auth-helper';
import { createTestApp } from './helpers/test-app';

describe('Stories (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('작성자가 viewer를 핑거로 지정한 경우 FINGER_ONLY 스토리를 볼 수 있어야 한다', async () => {
    const userA = await signupAndLogin(app, 'storyA@example.com', 'story_a');
    const userB = await signupAndLogin(app, 'storyB@example.com', 'story_b');

    await request(app.getHttpServer())
      .post(`/api/v1/fingers/${userB.user.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/api/v1/stories')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        contentText: 'story secret',
        visibilityType: 'FINGER_ONLY',
      })
      .expect(201);

    const storyId = created.body.data.id;

    await request(app.getHttpServer())
      .get(`/api/v1/stories/${storyId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(200);
  });
});
