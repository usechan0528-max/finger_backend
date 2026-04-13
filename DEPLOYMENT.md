# Deployment Checklist

`project_finger`를 로컬 또는 서버 환경에 올릴 때 빠르게 확인할 항목들입니다.

## 1. 환경 변수

필수 환경 변수:

- `PORT`
- `FRONTEND_ORIGINS`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

선택 환경 변수:

- `AWS_S3_PUBLIC_BASE_URL`
- `AWS_S3_PRIVATE_URL_TTL_SECONDS`
- `AWS_S3_ENDPOINT`
- `AWS_S3_FORCE_PATH_STYLE`

앱은 부팅 시 Joi validation으로 환경 변수를 검사합니다.

`FRONTEND_ORIGINS`는 쉼표로 구분한 프론트 주소 목록입니다.

예:

```bash
FRONTEND_ORIGINS="http://localhost:3001,https://finger-web-seven.vercel.app"
```

## 2. 데이터베이스

배포 전에 DB 연결이 가능한지 확인합니다.

```bash
npm run prisma:generate
npm run prisma:deploy
```

테이블이 없거나 스키마가 어긋나 있으면 앱은 정상 동작하지 않습니다.

## 3. 애플리케이션 빌드

```bash
npm install
npm run build
```

빌드가 통과해야 런타임 타입 오류나 Nest DI 문제를 미리 잡을 수 있습니다.

## 4. 헬스 체크

서버가 올라온 뒤 아래 엔드포인트를 확인합니다.

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

`/health`와 `/health/ready`는 DB 쿼리까지 확인합니다.

실제 외부 노출은 Nginx reverse proxy를 통해 들어오며, proxy가 내부 `app:3000`으로 전달합니다.
로컬 실험 환경에서는 self-signed TLS 인증서를 사용합니다.

## 5. Swagger

Swagger는 `NODE_ENV !== 'production'`일 때만 열립니다.

- 개발 환경: `/docs`
- 운영 환경: 비활성화

운영 서버에서 Swagger가 열려 있으면 `NODE_ENV` 설정을 다시 확인합니다.

## 6. Docker 로컬 실행

```bash
npm run docker:up
```

현재 compose의 `app` 서비스는 `Dockerfile` 기반 이미지로 실행됩니다.
개발 중 watch 모드가 아니라, 실제 배포에 더 가까운 방식으로 build 후 `node dist/main.js`를 사용합니다.
외부 진입점은 `proxy` 서비스이며, `80` 포트로 노출됩니다.

포트:

- Proxy: `80`
- Proxy TLS: `443`
- Postgres: `5432`
- MinIO API: `9000`
- MinIO Console: `9001`

초기화 리셋이 필요하면:

```bash
npm run docker:reset
npm run docker:up
```

## 7. E2E 테스트

테스트 DB 마이그레이션:

```bash
DATABASE_URL="postgresql://finger:finger@localhost:5432/finger_test_db?schema=public" npx prisma migrate deploy
```

그다음:

```bash
npm run test:e2e
```

## 8. 운영 전 마지막 확인

- CORS origin이 실제 프론트 주소와 맞는지
- JWT secret이 기본값이 아닌지
- DB migration이 최신인지
- S3 또는 MinIO bucket이 준비됐는지
- `/api/v1/health/ready`가 정상인지
- 로그에 5xx가 반복되지 않는지

## 9. 고정 배포 빠른 시작

### Railway

루트에 포함된 `railway.json`을 그대로 사용할 수 있습니다.

필요한 것:

- Railway 프로젝트
- Postgres 서비스
- 위 환경 변수들

배포 후 헬스 체크:

- `/api/v1/health`

### Render

루트에 포함된 `render.yaml`을 사용할 수 있습니다.

필요한 것:

- Render Web Service
- Render Postgres
- S3 또는 R2 환경 변수
- `FRONTEND_ORIGINS`에 실제 프론트 주소 입력

## 10. Cloudflare R2 빠른 연결

이미지 업로드까지 살리려면 Render 백엔드에 외부 스토리지가 필요합니다.
현재 구조에서는 Cloudflare R2가 가장 가볍고, 비용 부담도 작습니다.

### 준비할 것

- Cloudflare 계정
- R2 bucket 1개
- R2 API token 또는 access key / secret key
- 공개 조회용 주소 1개
  - 베타 단계면 `r2.dev`
  - 더 안정적으로 쓰려면 custom domain

### bucket 설정

1. R2 bucket 생성
2. 필요하면 Public access 활성화
3. Public URL 확보
   - 예: `https://pub-xxxx.r2.dev`

### Render 환경 변수 예시

```bash
AWS_REGION=auto
AWS_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
AWS_S3_BUCKET=<R2_BUCKET_NAME>
AWS_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_S3_PRESIGN_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_S3_PUBLIC_BASE_URL=https://<PUBLIC_BUCKET_DOMAIN>
AWS_S3_FORCE_PATH_STYLE=true
```

### 왜 ACL을 쓰지 않나

R2는 bucket 공개 범위를 bucket/domain 단위로 다루는 편이 더 자연스럽습니다.
그래서 현재 업로드 코드는 object마다 `public-read` ACL을 따로 붙이지 않도록 정리되어 있습니다.

### 연결 후 확인

1. Render 서비스 재배포
2. `/api/v1/health` 확인
3. 프론트에서 프로필 사진 또는 게시물 이미지 업로드 테스트
