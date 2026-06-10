# ai-diet-coach

Next.js, Auth.js, Prisma, PostgreSQL, ChatMock 호환 AI API를 사용하는 모바일 우선 식단 분석 앱입니다.

## 주요 기능

- 이메일/비밀번호 회원가입, 로그인
- 사용자 프로필 기반 BMR, TDEE, 목표 칼로리, 탄단지 g 계산
- 음식 DB 검색, 직접 입력, 식사 기록 추가/수정/삭제
- 바코드, 상품명, 패키지 사진 기반 포장식품 영양정보 검색
- 권장량과 실제 섭취량 비교
- ChatMock 기반 식단 피드백, 음식 사진 후보 추정, 패키지 사진 정보 추출
- 포장식품 후보에서 실제 먹은 g 단위로 칼로리와 영양성분 재계산
- 모바일 하단 탭과 데스크톱 사이드 내비게이션

## 로컬 실행

```bash
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

브라우저에서 `http://localhost:9000`을 엽니다.

AI 기능은 ChatMock 로컬 서버를 기본값으로 사용합니다. `chatmock login && chatmock serve`를 실행하면 `http://127.0.0.1:8000/v1`로 연결됩니다. 서버가 꺼져 있으면 피드백은 규칙 기반으로, 일반 음식 사진 인식은 예시 후보로 동작합니다.

포장식품 검색은 바코드를 우선 사용하고, 상품명 검색은 Open Food Facts 검색 API를 사용합니다. 패키지 사진은 ChatMock/OpenAI 호환 Vision 호출로 바코드, 상품명, 라벨 영양성분을 추출한 뒤 Open Food Facts 후보와 합칩니다. Open Food Facts 데이터는 커뮤니티 기반이므로 저장 전 상품명, 중량, 영양성분을 확인하세요.

## 한번에 실행

```bash
npm run serve
```

`scripts/serve.sh`는 `.env` 생성, PostgreSQL 컨테이너 실행, Prisma 반영, seed, production build, `0.0.0.0:9000` 바인딩까지 처리합니다.

외부 접속 주소가 공인 IP라면 `.env`의 `NEXTAUTH_URL`을 실제 주소로 바꿔야 세션 콜백이 맞습니다.

```env
NEXTAUTH_URL="http://공인IP:9000"
AUTH_TRUST_HOST="true"
```

## 리눅스 운영 배포

서버 예시 경로는 `/opt/ai-diet-coach`입니다.

```bash
sudo apt update
sudo apt install -y git curl docker.io docker-compose-plugin
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo git clone https://github.com/yes2310/ai-diet-coach.git /opt/ai-diet-coach
cd /opt/ai-diet-coach
sudo cp .env.example .env
sudo nano .env
```

`.env`에서 최소한 아래 값을 운영 환경에 맞게 수정합니다.

```env
AUTH_SECRET="긴_랜덤_문자열"
NEXTAUTH_URL="http://공인IP:9000"
AUTH_TRUST_HOST="true"
DATABASE_URL="postgresql://nutrition:nutrition@localhost:5432/nutrition_ai?schema=public"
CHATMOCK_BASE_URL="http://127.0.0.1:8000/v1"
```

Open Food Facts는 인증 없이 읽기 API를 사용하지만, 운영 환경에서는 연락 가능한 User-Agent를 설정하는 편이 좋습니다.

```env
OPEN_FOOD_FACTS_USER_AGENT="ai-diet-coach/0.1.0 (contact@example.com)"
```

방화벽에서 외부 접속 포트를 열어야 합니다.

```bash
sudo ufw allow 9000/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

systemd 서비스로 등록하면 재부팅 후에도 자동 실행됩니다.

```bash
sudo cp deploy/ai-diet-coach.service /etc/systemd/system/ai-diet-coach.service
sudo systemctl daemon-reload
sudo systemctl enable --now ai-diet-coach
sudo systemctl status ai-diet-coach
```

운영 로그는 아래 명령으로 확인합니다.

```bash
journalctl -u ai-diet-coach -f
```

## ChatMock 실행

```bash
brew tap RayBytes/chatmock
brew install chatmock
chatmock login
chatmock serve
```

## 검증

```bash
npm run lint
npm run test
npm run build
```

## 접속 IP / API 사용량 조회

API 요청은 `RequestLog` 테이블에 IP, user-agent, method, path, status, 사용자 id, 시간을 저장합니다. 운영자는 서버 터미널에서 바로 조회할 수 있습니다.

```bash
npm run usage:stats
npm run usage:stats -- 30
```

외부에서 API로 조회하려면 `.env`에 `ADMIN_TOKEN`을 긴 랜덤값으로 설정한 뒤 아래처럼 호출합니다.

```bash
curl "http://공인IP:9000/api/admin/usage?days=7&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 환경변수

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `AUTH_SECRET`: Auth.js 세션 서명용 긴 랜덤 문자열
- `NEXTAUTH_URL`: 로컬 기본값 `http://localhost:9000`
- `AUTH_TRUST_HOST`: 공인 IP 또는 프록시 환경에서 Auth.js host 검증 허용
- `ADMIN_TOKEN`: 접속 IP/API 사용량 조회용 관리자 토큰
- `CHATMOCK_BASE_URL`, `CHATMOCK_API_KEY`, `CHATMOCK_MODEL`: ChatMock OpenAI 호환 API 설정
- `OPEN_FOOD_FACTS_USER_AGENT`: Open Food Facts 상품 검색 요청용 User-Agent

## QA 참고

`npm test`는 영양 계산, Open Food Facts 정규화, 요청 파싱, 사진 업로드 검증을 확인합니다. `/api/photo/product-search`는 로그인 세션과 외부 Open Food Facts 응답에 의존하므로 전체 라우트 동작은 개발 서버에서 바코드 `3017624010701` 같은 실제 상품으로 수동 스모크하는 방식으로 검증합니다.
