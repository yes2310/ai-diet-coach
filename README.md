# ai-diet-coach

Next.js, Auth.js, Prisma, PostgreSQL, ChatMock 호환 AI API를 사용하는 모바일 우선 식단 분석 앱입니다.

## 주요 기능

- 이메일/비밀번호 회원가입, 로그인, 이메일 인증
- 사용자 프로필 기반 BMR, TDEE, 목표 칼로리, 탄단지 g 계산
- 음식 DB 검색, 직접 입력, 식사 기록 추가/수정/삭제
- 권장량과 실제 섭취량 비교
- ChatMock 기반 식단 피드백과 음식 사진 후보 추정
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

브라우저에서 `http://localhost:3000`을 엽니다.

SMTP 환경변수를 비워두면 이메일 인증 링크가 개발 서버 콘솔에 출력됩니다.
AI 기능은 ChatMock 로컬 서버를 기본값으로 사용합니다. `chatmock login && chatmock serve`를 실행하면 `http://127.0.0.1:8000/v1`로 연결됩니다. 서버가 꺼져 있으면 피드백은 규칙 기반으로, 사진 인식은 예시 후보로 동작합니다.

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

## 환경변수

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `AUTH_SECRET`: Auth.js 세션 서명용 긴 랜덤 문자열
- `NEXTAUTH_URL`: 로컬 기본값 `http://localhost:3000`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: 인증 메일 발송 설정
- `CHATMOCK_BASE_URL`, `CHATMOCK_API_KEY`, `CHATMOCK_MODEL`: ChatMock OpenAI 호환 API 설정
