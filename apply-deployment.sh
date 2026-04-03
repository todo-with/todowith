#!/bin/bash

# SSH 서버에서 실행할 배포 적용 스크립트
# 사용법: ./apply-deployment.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 배포 적용 중...${NC}"
echo ""

# 현재 상태 확인
echo -e "${YELLOW}📋 현재 컨테이너 상태:${NC}"
docker-compose ps
echo ""

# 최신 이미지 당겨오기
echo -e "${YELLOW}📥 최신 이미지 다운로드 중...${NC}"
docker-compose pull
echo ""

# 컨테이너 재시작
echo -e "${YELLOW}🔄 컨테이너 재시작 중...${NC}"
docker-compose up -d
echo ""

# 헬스 체크
echo -e "${YELLOW}⏳ 헬스 체크 중... (약 10초 대기)${NC}"
sleep 3
docker-compose ps
echo ""

# 로그 확인
echo -e "${YELLOW}📊 최근 로그:${NC}"
docker-compose logs --tail=50 frontend backend
echo ""

echo -e "${GREEN}✅ 배포 완료!${NC}"
echo ""
echo -e "${YELLOW}🌐 접속 정보:${NC}"
echo "  Frontend: http://your-server-address"
echo "  API: http://your-server-address/api"
echo ""
echo -e "${YELLOW}📝 유용한 명령어:${NC}"
echo "  - 로그 실시간 확인: docker-compose logs -f"
echo "  - 특정 서비스 로그: docker-compose logs -f frontend"
echo "  - 컨테이너 상태: docker-compose ps"
echo "  - 컨테이너 중지: docker-compose down"
