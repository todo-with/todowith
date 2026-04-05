# 🍋 TodoWith: Sync, Share, and Grow

<p align="center">
  <img src="https://github.com/user-attachments/assets/cb4d446b-3745-43e4-b6d0-546133016678" width="300" height="300" alt="logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=FastAPI&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=Next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=Docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=Redis&logoColor=white" />
</p>

---

### 💡 "돈 대신 재능을, 기록 대신 성장을"
> **TodoWith**는 배우고 싶은 사람과 가르치고 싶은 사람이 만나, 비용 부담 없이 서로의 지식을 나누는 **지식 물물교환(Knowledge Barter)** 플랫폼입니다.  
> 단순한 일정 관리를 넘어, AI가 대화를 분석해 최적의 **학습 로드맵(Todo)** 생성을 도와주는 스마트한 협업 환경을 지향합니다.

---

### 🎥 프로젝트 구현 화면 (Demo)
<p align="center">
  <img src="https://github.com/user-attachments/assets/f7f89305-66e7-4ded-a193-d5dd6031e13f" width="80%" alt="구현 화면" />
</p>

---

### 🔥 핵심 기능 (Main Features)

#### 🤝 **지식 물물교환 (Knowledge Barter)**
* 코딩, 악기, 외국어 등 당신이 가진 재능이 곧 화폐가 됩니다. 
* 서로의 기술을 교환하며 함께 배움의 즐거움을 나눕니다.

#### 🤖 **AI 기반 Smart To-do 생성**
* 파트너와의 대화 내용을 AI가 실시간으로 분석합니다.
* *"우리 다음 주에 이 부분 같이 공부해보자~"* 라는 말 한마디를 **실행 가능한 Todo 리스트**로 자동 변환합니다.

#### ⚡ **실시간 협업 동기화**
* Redis와 WebSocket을 활용해 파트너와 같은 화면을 보듯 일정을 동기화합니다.
* 멀리 떨어져 있어도 마치 옆에 있는 것처럼 함께 스케줄을 짜보세요.

#### 🔒 **강력한 보안 및 인프라**
* **HTTPS:** SSL 인증서가 적용된 안전한 데이터 암호화 통신.
* **Dockerized:** 전체 스택의 컨테이너화로 어디서든 즉시 배포 가능.

---

### 🏗️ 시스템 설계 (System Design)

#### **Architecture**
<p align="center">
  <img src="https://github.com/user-attachments/assets/cec3a417-1495-473d-a4bb-d26bbbaf4abe" width="80%" alt="architecture" />
</p>

#### **Chat System Flow**
<p align="center">
  <img src="https://github.com/user-attachments/assets/4f4b467c-64d9-4240-ab6c-d773257d24a2" width="80%" alt="chat-system" />
</p>

#### **ERD**
<p align="center">
  <img src="https://github.com/user-attachments/assets/1c172965-f46c-4379-ae1d-9996d66cf13f" width="80%" alt="erd" />
</p>

---

### 🚀 기술적 도전 (Technical Challenges)

* **AI Agent Integration:** 비정형화된 대화 데이터에서 핵심 과업(Actionable Task)을 추출하는 프롬프트 엔지니어링 및 파싱 로직 구현.
* **Infrastructure Optimization:** AWS EC2 환경에서 Nginx를 이용한 리버스 프록시와 SSL 자동 갱신 아키텍처 설계.
* **Real-time Data Processing:** 다중 사용자 환경에서 데이터 일관성을 유지하기 위한 Redis 캐싱 전략 수립.

---

### 👨‍💻 Team TodoWith (Team 8)

| <img src="https://github.com/user-attachments/assets/3de2a42f-7abe-407c-9eb1-96519f7d3408" width="150" height="200" /> | <img src="https://github.com/user-attachments/assets/25315657-8fd6-4693-92cc-5cd3d9fc7817" width="150" height="200" /> | <img src="https://github.com/user-attachments/assets/7f0b5816-6f81-4472-805a-d2464c32fb23" width="150" height="200" /> | <img src="https://github.com/user-attachments/assets/00e5a5d2-6a2e-47b3-b5df-fe68181c130e" width="150" height="200" /> | <img src="https://github.com/user-attachments/assets/88fe4163-954d-492f-aa38-2cdf21099c5f" width="150" height="200" /> |
| :---: | :---: | :---: | :---: | :---: |
| **정대균** | **안시현** | **한준희** | **신연호** | **김성현** |
| [@jdk829355](https://github.com/jdk829355) | [@xihxxn](https://github.com/xihxxn) | [@0armer](https://github.com/0armer) | [@speter0601](https://github.com/speter0601) | [@tjdgusdlqslek](https://github.com/tjdgusdlqslek) |
| Backend / Frontend | Backend / Infra | Backend | AI | AI |

---

<p align="center">
  <b>함께할 때 더 즐거운 성장, TodoWith와 시작하세요! 🍋</b>
</p>
