<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# YKSpace

2인용 미니 그룹웨어/학습 대시보드. inflearn 풍의 가볍고 캐주얼한 디자인. Docker로 홈서버에 셀프호스팅 목표.

## 기능

- **대시보드** (`/dashboard`): 출퇴근 위젯, 통계, 내 최근 활동, 내 목표, 멤버
- **업무일지** (`/work-logs`): 하루 1개 제약, 날짜 ◀▶ 네비게이터로 조회. 제목은 content 첫 줄에서 자동 생성
- **학습노트** (`/study-notes`, `/study-notes/[id]`): 게시판형 리스트 + 상세 페이지, 페이지네이션
- **회의록** (`/meetings`): 모달 작성, 액션아이템 체크, 페이지네이션
- **목표** (`/goals`): 주간/월간 탭, 멤버별 표시, 본인 것만 토글/삭제 가능
- **출근부** (`/attendance`): 월 달력, 출퇴근 시간/근무시간 표시

## 기술 스택

- Next.js 15 App Router + TypeScript, Tailwind v4 + shadcn/ui(base-ui 기반)
- Prisma v7 + PostgreSQL, NextAuth v5(JWT 전략, Credentials provider)
- 날짜: date-fns, 토스트: sonner, 아이콘: lucide-react

## 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npx prisma migrate dev --name <name>   # 마이그레이션 (대화형)
npx tsx prisma/seed.ts                 # 시드 (현수/지수 계정, password123)
```

## 주의사항 (중요)

- **Prisma v7**: PrismaClient는 `@/generated/prisma/client`에서 import (not `@prisma/client`). 생성 시 반드시 `PrismaPg` adapter 필요. `schema.prisma`에 `url` 없음 → `prisma.config.ts`에서 관리.
- **스키마/마이그레이션 변경 후 dev 서버 재시작 필수** — 안 하면 구 Prisma 클라이언트 캐시로 "column does not exist" 에러.
- **DB는 Docker 컨테이너 `ykspace-db`, 호스트 포트 5433** (기존 postgres 5432와 충돌 피함). `.env`의 DATABASE_URL 참고.
- `prisma migrate dev`는 데이터 손실 경고 시 비대화형에서 멈춤 → 마이그레이션 SQL 직접 작성 후 `migrate deploy` 사용.
- **반응형**: 데스크톱은 `Sidebar`(hidden md:flex), 모바일은 `MobileNav`(상단바 + Sheet 드로어). nav 항목은 `src/components/layout/nav.ts` 공유. flex 안 truncate는 `min-w-0` 필수.
- **아바타 색상**: `userColor(userId)`로 유저별 고정 색 배정 (`src/lib/avatar.ts`).
- **소유권**: 수정/삭제 API는 항상 `session.user.id`와 대조해 본인 것만 허용.
- 배포 시 `.env`의 `NEXTAUTH_SECRET`을 랜덤 값으로 교체 필요.
