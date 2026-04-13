import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

type SignupResult = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
};

export async function signupAndLogin(
  app: INestApplication,
  email: string,
  username: string,
  password = '12345678',
): Promise<SignupResult> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/signup')
    .send({
      email,
      username,
      password,
    })
    .expect(201);

  return response.body.data;
}
