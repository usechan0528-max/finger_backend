# Nginx Proxy

`default.conf`는 외부 HTTP/HTTPS 요청을 `app:3000`으로 reverse proxy 합니다.

- API: `/api/v1/*`
- Swagger: `/docs`
- Socket.IO / WebSocket upgrade: 동일 프록시 location에서 처리
- `80 -> 443` redirect
- `/nginx-health`는 proxy 자체 healthcheck용
