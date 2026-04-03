#!/bin/bash

# 배포 자동화 스크립트
# 사용법: ./deploy.sh [backend|frontend|both]

set -e  # 오류 발생 시 즉시 종료

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 기본값
DEPLOY_TARGET="${1:-both}"
REGISTRY="xihxxn"

echo -e "${YELLOW}🚀 배포 프로세스 시작${NC}"
echo "대상: $DEPLOY_TARGET"
echo ""

# 백엔드 배포
deploy_backend() {
    echo -e "${YELLOW}📦 백엔드 이미지 빌드 중...${NC}"
    docker build -f Dockerfile -t $REGISTRY/todowith-backend:latest .
    
    echo -e "${YELLOW}📤 백엔드 이미지 푸시 중...${NC}"
    docker push $REGISTRY/todowith-backend:latest
    
    echo -e "${GREEN}✅ 백엔드 배포 완료!${NC}"
}

# 프론트엔드 배포
deploy_frontend() {
    echo -e "${YELLOW}📦 프론트엔드 이미지 빌드 중...${NC}"
    docker build -f frontend/Dockerfile -t $REGISTRY/todowith-frontend:latest ./frontend
    
    echo -e "${YELLOW}📤 프론트엔드 이미지 푸시 중...${NC}"
    docker push $REGISTRY/todowith-frontend:latest
    
    echo -e "${GREEN}✅ 프론트엔드 배포 완료!${NC}"
}

# 전체 배포
deploy_both() {
    deploy_backend
    echo ""
    deploy_frontend
}

# 선택된 대상에 따라 배포
case $DEPLOY_TARGET in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    both)
        deploy_both
        ;;
    *)
        echo -e "${RED}❌ 잘못된 입력입니다. 사용법: ./deploy.sh [backend|frontend|both]${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 배포 완료!${NC}"
echo ""
echo -e "${YELLOW}📝 다음 단계 (SSH 서버에서):${NC}"
echo "  1. docker-compose pull"
echo "  2. docker-compose up -d"
echo "  3. docker-compose logs -f"
