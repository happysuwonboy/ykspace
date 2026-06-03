import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { subDays, subHours } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const me = await prisma.user.upsert({
    where: { email: "you@example.com" },
    update: {},
    create: { name: "현수", email: "you@example.com", password },
  });

  const partner = await prisma.user.upsert({
    where: { email: "partner@example.com" },
    update: {},
    create: { name: "지수", email: "partner@example.com", password },
  });

  console.log("✅ Users seeded");

  // ── 업무일지 ──────────────────────────────────────────────
  await prisma.workLog.createMany({
    data: [
      // 오늘
      {
        userId: me.id,
        title: "Next.js 프로젝트 셋업 완료",
        content: "YKSpace 프로젝트 초기 셋업을 마쳤다.\nPrisma 스키마 설계하고 Docker Compose 구성까지 완료.\n내일은 UI 디테일 다듬을 예정.",
        createdAt: subHours(new Date(), 2),
        date: new Date(),
      },
      {
        userId: partner.id,
        title: "리액트 훅 개념 정리 및 실습",
        content: "useEffect, useCallback, useMemo 차이를 제대로 정리했다.\n특히 useMemo는 계산 비용이 비쌀 때만 쓰는 게 맞다는 걸 다시 확인.\n간단한 Todo 앱으로 실습도 했음.",
        createdAt: subHours(new Date(), 1),
        date: new Date(),
      },
      // 어제
      {
        userId: me.id,
        title: "DB 스키마 설계 및 ERD 작성",
        content: "User, WorkLog, StudyNote, Meeting, Goal 테이블 설계.\nMeeting↔User 다대다 관계 처리를 위해 MeetingParticipant 중간 테이블 추가.\nReaction 기능도 스키마에 포함시켰다.",
        createdAt: subDays(new Date(), 1),
        date: subDays(new Date(), 1),
      },
      {
        userId: partner.id,
        title: "CSS Grid 레이아웃 복습",
        content: "Grid와 Flexbox를 언제 쓰는지 다시 정리.\n2차원 레이아웃 → Grid, 1차원 → Flexbox.\nTailwind로 grid-cols 사용하는 연습도 했음.",
        createdAt: subDays(new Date(), 1),
        date: subDays(new Date(), 1),
      },
      // 2일 전
      {
        userId: me.id,
        title: "NextAuth.js 인증 구현",
        content: "Credentials provider로 이메일/비밀번호 로그인 구현.\nJWT 세션 전략 사용, session 콜백에서 userId 주입.\n로그인 → 대시보드 리다이렉트까지 정상 동작 확인.",
        createdAt: subDays(new Date(), 2),
        date: subDays(new Date(), 2),
      },
      {
        userId: partner.id,
        title: "TypeScript 제네릭 공부",
        content: "제네릭 기본 문법부터 제약 조건(extends), 조건부 타입까지 학습.\n처음엔 헷갈렸는데 실제 코드에 적용해보니까 훨씬 이해가 잘 됨.\nUtility Types (Partial, Pick, Omit) 도 같이 정리.",
        createdAt: subDays(new Date(), 2),
        date: subDays(new Date(), 2),
      },
      // 4일 전
      {
        userId: me.id,
        title: "Tailwind + shadcn/ui 컴포넌트 세팅",
        content: "shadcn init 하고 필요한 컴포넌트들 추가.\nCard, Badge, Avatar, Button, Input 등 기본 컴포넌트 세팅 완료.\n컬러 테마를 인프런 스타일 그린 계열로 커스텀.",
        createdAt: subDays(new Date(), 4),
        date: subDays(new Date(), 4),
      },
      {
        userId: partner.id,
        title: "알고리즘 스터디 - BFS/DFS",
        content: "BFS는 큐, DFS는 스택(재귀)으로 구현.\n백준 1260번 풀었음. 시간복잡도 O(V+E) 개념도 다시 정리.\n다음엔 최단경로 다익스트라 풀어볼 예정.",
        createdAt: subDays(new Date(), 4),
        date: subDays(new Date(), 4),
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Work logs seeded");

  // ── 학습노트 ──────────────────────────────────────────────
  await prisma.studyNote.createMany({
    data: [
      {
        userId: me.id,
        title: "React Server Components vs Client Components",
        content: `## 핵심 차이
- RSC: 서버에서만 실행, 번들에 포함 안 됨, useState/useEffect 사용 불가
- RCC: 클라이언트에서 실행, 인터랙션 가능

## 언제 RSC 쓰나?
- DB 직접 조회할 때
- 민감한 API 키 사용할 때
- 인터랙션이 필요 없는 정적 UI

## 언제 RCC 쓰나?
- useState, useEffect 필요할 때
- 브라우저 API (window, document) 쓸 때
- 이벤트 핸들러 필요할 때

Next.js App Router는 기본이 RSC, "use client" 선언 시 RCC로 전환됨.`,
        createdAt: subDays(new Date(), 1),
      },
      {
        userId: me.id,
        title: "Prisma v7 달라진 점 정리",
        content: `## 주요 변경사항
1. schema.prisma에 url 설정 제거됨 → prisma.config.ts로 이동
2. provider가 "prisma-client-js" → "prisma-client"로 변경
3. 반드시 adapter 또는 accelerateUrl 필요
4. generate output이 기본 src/generated/prisma로 변경

## import 방법
\`\`\`ts
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
\`\`\`

마이그레이션 명령어는 동일: npx prisma migrate dev`,
        createdAt: subDays(new Date(), 2),
      },
      {
        userId: partner.id,
        title: "useEffect 완전 정복",
        content: `## 기본 구조
\`\`\`js
useEffect(() => {
  // 실행할 코드
  return () => { // cleanup }
}, [의존성배열])
\`\`\`

## 의존성 배열 패턴
- [] : 마운트 시 1회만
- [value] : value 바뀔 때마다
- 없음 : 매 렌더마다 (거의 안 씀)

## 자주 하는 실수
- 의존성 배열에 함수 넣으면 무한루프 → useCallback으로 감싸기
- 비동기 함수 직접 넣으면 안 됨 → 내부에 async 함수 선언 후 호출`,
        createdAt: subDays(new Date(), 1),
      },
      {
        userId: partner.id,
        title: "HTTP 메서드와 REST API 설계 원칙",
        content: `## HTTP 메서드
- GET: 조회 (멱등)
- POST: 생성
- PUT: 전체 수정 (멱등)
- PATCH: 부분 수정
- DELETE: 삭제 (멱등)

## REST 설계 원칙
1. URI는 명사, 동사 X (users/1 O, getUser/1 X)
2. 복수형 사용 (users, posts)
3. 계층 관계 표현 (/users/1/posts)
4. 상태코드 의미 있게 사용

## 상태코드 정리
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- 500 Internal Server Error`,
        createdAt: subDays(new Date(), 3),
      },
      {
        userId: me.id,
        title: "Docker Compose 실전 패턴",
        content: `## 헬스체크 중요성
depends_on만 쓰면 컨테이너 뜨는 타이밍 보장 안 됨.
healthcheck + condition: service_healthy 조합으로 해결.

## volumes 전략
- 개발: bind mount (./src:/app/src) → 핫리로드
- 운영: named volume → 데이터 보존

## 자주 쓰는 명령어
\`\`\`bash
docker compose up -d --build  # 빌드 후 백그라운드 실행
docker compose logs -f app    # 특정 서비스 로그 실시간
docker compose exec app sh    # 컨테이너 진입
docker compose down -v        # 볼륨까지 삭제
\`\`\``,
        createdAt: subDays(new Date(), 3),
      },
      {
        userId: partner.id,
        title: "SQL JOIN 완전 정복",
        content: `## JOIN 종류
- INNER JOIN: 양쪽 다 있는 것만
- LEFT JOIN: 왼쪽 기준, 오른쪽 없으면 NULL
- RIGHT JOIN: 오른쪽 기준
- FULL OUTER JOIN: 양쪽 모두

## 실제 자주 쓰는 패턴
\`\`\`sql
-- 유저와 게시글 (1:N)
SELECT u.name, p.title
FROM users u
LEFT JOIN posts p ON u.id = p.user_id

-- N:M 관계
SELECT u.name, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
\`\`\`

NULL 체크는 = NULL 아니고 IS NULL!`,
        createdAt: subDays(new Date(), 5),
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Study notes seeded");

  // ── 회의록 ──────────────────────────────────────────────
  const meeting1 = await prisma.meeting.create({
    data: {
      title: "YKSpace 기획 회의",
      date: subDays(new Date(), 3),
      agenda: "1. 프로젝트 기능 범위 확정\n2. 기술 스택 결정\n3. 역할 분담\n4. 1차 목표 일정",
      notes: "기능은 업무일지, 학습노트, 회의록, 목표 트래커 4가지로 확정.\n기술 스택은 Next.js + Prisma + PostgreSQL로 결정.\n디자인은 인프런 스타일의 가볍고 깔끔한 느낌으로.\n\n두 명이 같이 쓰는 거라 권한 구분 없이 심플하게 가기로 함.",
      participants: {
        create: [{ userId: me.id }, { userId: partner.id }],
      },
      actionItems: {
        create: [
          { content: "Next.js 프로젝트 초기 셋업", done: true },
          { content: "DB 스키마 설계", done: true },
          { content: "로그인 기능 구현", done: true },
          { content: "메인 페이지 UI 완성", done: false },
        ],
      },
      createdAt: subDays(new Date(), 3),
    },
  });

  const meeting2 = await prisma.meeting.create({
    data: {
      title: "주간 스터디 회의 #1",
      date: subDays(new Date(), 6),
      agenda: "1. 이번 주 각자 공부한 내용 공유\n2. 다음 주 학습 목표 설정\n3. 어려웠던 부분 같이 해결",
      notes: "현수: Next.js App Router, Prisma 위주로 공부\n지수: React 훅, TypeScript 제네릭 정리\n\n서로 공부한 내용을 YKSpace에 올리고 공유하기로 함.\n다음 주는 현수 → 배포/인프라, 지수 → 알고리즘 집중.",
      participants: {
        create: [{ userId: me.id }, { userId: partner.id }],
      },
      actionItems: {
        create: [
          { content: "각자 학습노트 매일 1개 이상 작성", done: false },
          { content: "지수: 백준 실버 5문제", done: false },
          { content: "현수: Docker Compose 홈서버 배포 테스트", done: false },
          { content: "다음 주 회의 일정 잡기", done: true },
        ],
      },
      createdAt: subDays(new Date(), 6),
    },
  });

  console.log("✅ Meetings seeded");

  // ── 목표 ──────────────────────────────────────────────
  await prisma.goal.createMany({
    data: [
      { userId: me.id, title: "YKSpace 1차 배포 완료", type: "WEEKLY", done: false },
      { userId: me.id, title: "Docker + 홈서버 세팅", type: "WEEKLY", done: true },
      { userId: me.id, title: "Next.js 공식 문서 정독", type: "MONTHLY", done: false },
      { userId: me.id, title: "사이드 프로젝트 포트폴리오 정리", type: "MONTHLY", done: false },
      { userId: partner.id, title: "리액트 훅 완전 정복", type: "WEEKLY", done: true },
      { userId: partner.id, title: "백준 실버 5문제 풀기", type: "WEEKLY", done: false },
      { userId: partner.id, title: "TypeScript 핸드북 완독", type: "MONTHLY", done: false },
      { userId: partner.id, title: "CSS 레이아웃 마스터", type: "MONTHLY", done: true },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Goals seeded");
  console.log("\n🎉 모든 예시 데이터 생성 완료!");
  console.log("   현수: you@example.com / password123");
  console.log("   지수: partner@example.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
