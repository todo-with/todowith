# 🚀 배포 가이드

협업 배포 담당자를 위한 배포 프로세스 가이드입니다.

## 📋 배포 흐름

```
1. 로컬에서 코드 병합 & 테스트
   ↓
2. Docker 이미지 빌드 & 푸시
   ↓
3. SSH 서버에서 이미지 당겨오기 & 컨테이너 재시작
```

---

## 🔄 배포 프로세스 (매 배포마다)

### Step 1️⃣: 로컬에서 코드 병합

```bash
# 팀원의 코드 가져오기
git pull origin main

# 현재 브랜치에 병합
git merge main

# 상태 확인
git status
```

### Step 2️⃣: 로컬에서 도커 이미지 빌드 & 푸시

**방법 A: 자동화 스크립트 (권장)**

```bash
# 스크립트에 실행 권한 부여 (처음 한 번만)
chmod +x deploy.sh

# 프론트엔드만 배포
./deploy.sh frontend

# 백엔드만 배포
./deploy.sh backend

# 전체 배포
./deploy.sh both
```

**방법 B: 수동 빌드**

```bash
# 프론트엔드 빌드 & 푸시
docker build -f frontend/Dockerfile -t xihxxn/todowith-frontend:latest ./frontend
docker push xihxxn/todowith-frontend:latest

# 백엔드 빌드 & 푸시
docker build -f Dockerfile -t xihxxn/todowith-backend:latest .
docker push xihxxn/todowith-backend:latest
```

### Step 3️⃣: SSH 서버에서 배포 적용

SSH 터미널에 접속하여:

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/2026_TEAM8_BE

# 자동화 스크립트 실행 (권장)
chmod +x apply-deployment.sh
./apply-deployment.sh

# 또는 수동 적용
docker-compose pull
docker-compose up -d
```

---

## 📊 배포 후 확인

### 컨테이너 상태 확인
```bash
docker-compose ps
```

### 로그 확인
```bash
# 모든 로그
docker-compose logs -f

# 프론트엔드만
docker-compose logs -f frontend

# 백엔드만
docker-compose logs -f backend

# 최근 50줄만
docker-compose logs --tail=50
```

### 로그인 기능 테스트
```bash
# 서버 접속
http://your-server-address/login

# API 직접 테스트
curl -X POST http://your-server-address/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 🔧 프로덕션 Dockerfile 업데이트 사항

| 항목 | 기존 | 변경됨 |
|------|------|--------|
| 빌드 방식 | 개발 모드 (`npm run dev`) | 프로덕션 빌드 (`npm run build` + `npm start`) |
| 이미지 크기 | 커짐 (dev dependencies 포함) | 작아짐 (prod dependencies만) |
| 다단계 빌드 | 없음 | 추가됨 (Builder → Runtime) |
| 시작 시간 | 빠름 | 정상 (프로덕션 최적화) |

---

## ⚡ 빠른 참고 명령어

| 상황 | 명령어 |
|------|--------|
| 이미지만 다시 빌드 | `docker-compose build frontend` |
| 컨테이너 완전 재시작 | `docker-compose down && docker-compose up -d` |
| 컨테이너 강제 종료 | `docker-compose kill` |
| 이전 상태로 롤백 | `docker-compose pull && docker-compose up -d` |
| 로그인 페이지 확인 | `curl http://localhost/login \| grep -i login` |

---

## 🐛 문제 해결

### 로그인이 여전히 반영 안 됨
1. `docker-compose ps`로 프론트엔드 컨테이너가 실행 중인지 확인
2. `docker-compose logs frontend`로 오류 확인
3. ssh 서버에서 `docker image ls`로 이미지 버전 확인
4. 강제 재배포:
   ```bash
   docker-compose down
   docker-compose pull
   docker-compose up -d --force-recreate
   ```

### 빌드 실패
```bash
# 캐시 삭제 후 재빌드
docker builder prune -a
./deploy.sh both
```

### 이미지 푸시 실패
```bash
# Docker Hub 로그인 확인
docker login

# 이미지명 확인 (xihxxn/todowith-*)
docker image ls | grep todowith
```

---

## 📌 주의 사항

✅ **필수**
- 배포 전 모든 코드 커밋 및 푸시 완료
- SSH 서버에서 `.env.secret` 파일 존재 확인
- 배포 후 로그인 페이지 직접 테스트

❌ **금지**
- 컨테이너 실행 중 수동으로 코드 수정 금지 (도커 이미지로 관리)
- `docker rm`, `docker rmi` 등 존재하지 않는 컨테이너/이미지 삭제 금지
- 개발 중 프로덕션 이미지로 로컬 테스트 금지

---

## 📞 팀 소통

> 배포 완료 후 팀에 알리기
```
✅ 배포 완료!
- 변경사항: [로그인 기능 수정 등]
- 배포 시간: [시간]
- 영향받은 기능: [프론트엔드/백엔드]
```

---

**마지막 수정**: 2026-04-04
