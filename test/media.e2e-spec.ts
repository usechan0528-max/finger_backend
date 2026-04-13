import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { signupAndLogin } from './helpers/auth-helper';
import { createTestApp } from './helpers/test-app';

describe('Media (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('업로드용 presigned URL을 발급해야 한다', async () => {
    const user = await signupAndLogin(app, 'media1@example.com', 'media_user_1');

    const response = await request(app.getHttpServer())
      .post('/api/v1/media/upload-url')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        purpose: 'POST',
        mediaType: 'IMAGE',
        mimeType: 'image/jpeg',
        originalFileName: 'photo.jpg',
        visibility: 'PRIVATE',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.objectKey).toContain('posts/');
    expect(response.body.data.uploadUrl).toBeDefined();
  });
});
