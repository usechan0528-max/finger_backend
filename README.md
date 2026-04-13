# project_finger

NestJS + Prisma 기반의 Finger SNS 백엔드입니다.

## 포함된 구성

- Auth
- Fingers
- Posts
- Profiles
- Message Rooms / Messages
- Stories
- Media(S3/MinIO presigned URL)
- Prisma migration
- Swagger
- E2E test
- Docker Compose(Postgres + MinIO + App)

## 빠른 시작

1. 환경 변수 준비

```bash
cp .env.example .env
```

2. 의존성 설치

```bash
npm install
```

3. Prisma client 생성 및 마이그레이션

```bash
npm run prisma:generate
npm run prisma:deploy
```

4. 개발 서버 실행

```bash
npm run start:dev
```

기본 API prefix는 `/api/v1`, Swagger 문서는 `/docs`입니다.
운영 환경에서는 Swagger가 비활성화됩니다.

## Docker 실행

```bash
npm run docker:up
```

`app` 서비스는 현재 소스 바인드 마운트가 아니라 `Dockerfile`로 이미지를 빌드해서 실행합니다.
즉, 코드 변경 후에는 다시 `npm run docker:up`으로 재배포하는 흐름을 기준으로 보면 됩니다.
외부 요청은 Nginx reverse proxy가 받아서 내부 `app:3000`으로 전달합니다.
로컬 배포 실험에서는 self-signed 인증서로 `https://localhost`도 함께 확인할 수 있습니다.

Postgres 초기화 시 `finger_db`와 `finger_test_db`를 함께 준비합니다.
이미 기존 Docker volume이 있다면 초기화 스크립트가 다시 실행되지 않을 수 있으니,
테스트 DB가 안 보이면 아래처럼 볼륨까지 리셋한 뒤 다시 올리면 됩니다.

```bash
npm run docker:reset
npm run docker:up
```

## 테스트

처음 테스트를 돌리기 전에 테스트 DB에도 마이그레이션을 적용해야 합니다.

```bash
DATABASE_URL="postgresql://finger:finger@localhost:5432/finger_test_db?schema=public" npx prisma migrate deploy
```

그다음 e2e를 실행합니다.

```bash
npm run test:e2e
```

테스트는 `.env.test` 기준으로 `finger_test_db`에 연결합니다.

## 헬스 체크

- `GET http://localhost/api/v1/health`
- `GET http://localhost/api/v1/health/live`
- `GET http://localhost/api/v1/health/ready`
- `GET https://localhost/api/v1/health` (`self-signed`라 브라우저 경고 또는 `curl -k` 필요)

내부 app 컨테이너는 `3000` 포트를 직접 외부에 노출하지 않고, Nginx proxy 뒤에서 동작합니다.

## 운영 메모

배포 전 확인 항목은 [`DEPLOYMENT.md`](/Users/dldydcks/Documents/project_finger/DEPLOYMENT.md)에서 빠르게 볼 수 있습니다.
