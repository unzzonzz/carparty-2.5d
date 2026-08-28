# CarParty.io — 워크스페이스 지도

탑뷰 슈퍼카 레이싱 게임. **이 폴더(`~/github/carparty`)는 git repo 가 아니다.**
안에 형제로 놓인 두 개의 독립 repo 가 프로젝트의 전부다.

| 폴더 | 원격 | 역할 | 규모 |
|------|------|------|------|
| `carparty-client/` | `recers-of-carparty/carparty-client` (main) | React UI 셸 + 캔버스 게임 엔진 | 218 커밋 |
| `carparty-server/` | `recers-of-carparty/carparty-server` (main) | WebSocket 릴레이 + 60Hz 권위 시뮬 | 217 커밋 |

두 repo 는 `6ee5e21` ("Node 서버와 React 클라이언트를 독립 프로젝트로 분리") 까지
**히스토리를 공유**하고 그 뒤로 갈라졌다. 형제 폴더로 나란히 두는 것이 기본 전제다
(sim 동기화·정적 서빙 경로가 둘 다 `../<상대 repo>` 를 기본값으로 훑는다).

UI·주석·커밋 메시지는 전부 한국어다. 새 코드도 같은 톤을 따른다 — 이 코드베이스의
주석은 "무엇을" 이 아니라 **"왜 이렇게 했나 / 예전엔 어땠고 왜 바꿨나"** 를 적는다.

### 처음이라면 이 순서로

1. 이 파일 (전체 지도)
2. `carparty-server/NETCODE.md` — 넷코드 v4 설계 확정본. **구현의 기준 문서.**
3. 두 repo 의 `README.md` — 실행 · 배포 · 각 repo 의 자기 설명
4. `ANALYSIS.md` (이 폴더) — 사람이 읽는 구조 분석. 이 파일과 내용이 겹치지만
   설명 위주라 배경을 잡기 좋다

> **각 README 를 무조건 믿지 말 것.** 코드가 앞서가고 문서가 뒤처진 자리가 실제로
> 있었다 (§8). 문서와 코드가 다르면 **코드가 맞다** — NETCODE.md 만 예외로,
> 그건 "문서를 먼저 고친다"가 규칙이다.

### 이 프로젝트에 없는 것 (중요)

| 없는 것 | 그래서 어떻게 하나 |
|---------|-------------------|
| 테스트 스위트 (`npm test` 없음) | 검증은 `netbot.js` 실측 + 직접 플레이. 물리·넷코드를 만졌으면 netbot 을 돌린다 |
| 린터 · 포매터 (eslint/prettier 없음) | 주변 코드 스타일을 눈으로 맞춘다 |
| CI (`.github/` 없음) | 배포는 Render/Pages 의 push 자동배포뿐. 머지 전 자동 검사가 없다 |
| `node_modules` (현재 워크스페이스) | 실행하려면 각 repo 에서 `npm install` 부터 |

즉 **자동으로 잡아주는 안전망이 없다.** 고친 뒤에는 최소한 `node --check`,
가능하면 실제로 띄워서 확인한다.

### 조작키

| 키 | 동작 |
|----|------|
| `W A S D` (기본) 또는 `↑ ← ↓ →` | 가속 / 좌 / 후진 / 우 |
| `SPACE` | 브레이크 (어느 스킴이든 공통) |
| `Shift` | 스모 펀치 |
| `R` | 출발선 복귀 (타임어택 재시작) |
| `M` / `Enter` | 음소거 / 채팅 |

**한 번에 한 스킴만 동작한다.** `CONTROL_SCHEMES = ["wasd", "arrows"]` 이고 기본은
`wasd` — 설정에서 바꾼다. 옛 `"both"` 값은 `normScheme()` 이 `wasd` 로 접는다.
(클라이언트 README 의 "둘 다 동작한다"는 `05db2ac` "조작키 단일화" 이전 설명이라 틀렸다.)

---

## 1. 한 장짜리 아키텍처

```
브라우저
 └ index.html  (셸)          ← PWA·서비스워커·safe-area·포커스·초대링크만
    └ iframe /play.html      ← 게임 본체
        ├ React (App.jsx)    : 화면 "뼈대"만. 상태 없음. 1회 마운트 후 손 안 댐
        └ engine.js (6.9k줄) : 캔버스 렌더 + 입력 + 넷코드 v4 클라
             └ sim.js        ← 서버 sim.js 의 복제본 (생성물)
                              │
                     WebSocket │ /ws  (MSG_INPUT 4 ↑ / MSG_SNAP4 5 ↓ + JSON)
                              │
Node 서버 (server.js 3.2k줄)
 ├ 60Hz 고정틱 루프  : 입력 소화 → SIM.stepGroup(전원 + 페어 CCD) → 규칙 판정 → 스냅샷
 ├ sim.js (정본)     : 결정론 물리 · 트랙 지오메트리 · 충돌 · 타임어택 상태머신
 ├ 계정/기록/친구/칭호 : Upstash Redis 또는 users.json 폴백
 └ 보스 AI · 방/매치메이킹 · 관리자 명령 · 채팅 로그
```

핵심 불변식 하나만 기억하면 된다:
**클라이언트는 위치를 보내지 않는다. 버튼 비트만 보낸다. 물리도 기록도 서버가 계산한다.**

---

## 2. 절대 어기면 안 되는 규칙

1. **`carparty-client/src/game/sim.js` 를 직접 고치지 말 것.**
   정본은 `carparty-server/sim.js`. 클라 사본은 `scripts/sync-sim.mjs` 가 만드는
   생성물이고 (`predev`/`prebuild` 에서 자동 실행), 차이는 상단 3줄 배너와
   맨 끝 `export default SIM;` 뿐이다. 손으로 고치면 클라/서버 물리가 갈라져
   넷코드가 조용히 깨진다. 물리를 고쳤으면 클라 쪽에서 `npm run sync:sim`.

2. **시뮬 코어에 부작용·wall-clock·난수를 넣지 말 것.**
   `sim.js` 는 순수 함수 + 순수 데이터다. SFX/셰이크는 `stepCar` 가 **이벤트 배열을
   반환**해 클라가 소비한다. 만료는 전부 틱 필드(`invulnUntilTick` 등).
   난수가 필요하면 서버가 값을 이벤트에 실어 보낸다.

3. **결정론 격자를 건드리지 말 것.** 매 틱 끝 `quantize()` 가
   x,y→1/4px · v→1/8px/s · angle→A2I(i16) · steer→i8 로 반올림한다.
   스냅샷 인코딩과 같은 격자라서 크로스 엔진 부동소수 오차가 흡수된다.
   난독화에서 `numbersToExpressions` 를 끈 이유도 이것이다.

4. **`NETCODE.md` 가 구현의 기준이다.** 구현이 문서와 달라지면 **문서를 먼저 고친다**
   (문서 스스로 그렇게 선언한다). §11 에 "설계 대비 확정 편차" 목록이 있다.

5. **React 트리에 상태를 넣지 말 것.** 60Hz 루프를 React 상태에 태우면 프레임마다
   리렌더가 돈다. 엔진이 `document.getElementById` 로 잡아 명령형으로 채운다.
   `App.jsx` 의 JSX 순서는 z-index 없는 요소들의 쌓임 순서라 함부로 못 옮긴다.

---

## 3. 넷코드 v4 (`carparty-server/NETCODE.md` 요약)

**문제**: v3 는 "내 차 = 지금 / 상대 차 = 과거(보간 지연)" 라 한 화면에 두 시간
영역이 공존했다. 2667px/s · 지연 100ms 에서 상대가 항상 267px(차 7대) 뒤에 그려진다.
동기화 빈도로는 절대 안 사라지는 **구조적** 오차.

**해법**: 클라·서버가 같은 결정론 코어를 쓰고, 상대 차도 "내 예측 틱"까지 전방
시뮬해서 **모든 엔티티를 같은 시간 영역에 그린다.**

| 요소 | 값 / 위치 |
|------|-----------|
| 틱 | 60Hz (`SIM.TICK_RATE`), 모든 게임 시간은 틱 |
| 서버 루프 | `server.js:simLoop/doTick` — hrtime 드리프트 보정, 캐치업 6틱 초과 시 히치→전원 키프레임 |
| 클라 예측 틱 | `P = estServerTick + lead`, lead 1~20 적응 (`notePhase`) |
| lead 신호 | 60Hz 스냅샷 헤더의 `phase`(i8) — 2초 창 2등 최대값, 상승 즉시 / 하강 5초당 1틱 |
| 시계 | 스냅샷 틱 max-필터 (`noteServerTick`) + 2s ping/pong |
| 조정 | `reconcile()` — 히스토리[T] 대조, 불일치만 되감기+재생. 재생도 `stepGroup`(4서브스텝) |
| 렌더 수렴 | `errOff{x,y,a}` 감쇠. 150px / 25° 초과 시 스냅 + 셰이크 |
| 접촉 중 | 되감기 대신 소프트 블렌드(g 0.25 / 넉백 0.4) + errOff 수렴 |
| 상대 표시 | 전방 시뮬 + `REMOTE_POS_TAU 0.08s`, 각속도 상한 4.0rad/s, 공백 250ms 유지 |
| CCD | `FIXED_SUBSTEPS = 4` **상수** (동적 계산은 클라/서버 그룹 구성 차이로 발산) |
| 랙 보상 | 고정 35ms 되감기 (`rewindOf`) — §8 의 "시점 재구성"은 미채택 |
| 기아 | 0~4틱 유지 / 5틱~ 중립 코스트 / 45틱~ 하드 프리즈 + 판정 제외 |
| 키프레임 | 120틱(2s) 주기 + 입장·재접속·히치 |
| 백프레셔 | 64KB 스킵 / 1MB 종료 |

### 프로토콜

```
클라→서버  MSG_INPUT = 4  (바이너리 빅엔디언)
  u8 type | u32 ackSnapTick | u8 count | [u32 tick, u8 buttons] × count
  buttons: bit0 W, bit1 SPACE, bit2 A, bit3 D, bit4 S, bit5 PUNCH, bit6 RESTART
  (SIM.BTN = {W:1, SPACE:2, A:4, D:8, S:16, PUNCH:32, RESTART:64})
  수용 창 [lastConsumed+1, serverTick+24], 같은 틱 재전송은 first-write-wins,
  링버퍼 32슬롯, 프레임당 최근 3~6틱 중복 동봉(유실 공백 메움)

서버→클라  MSG_SNAP4 = 5  (60Hz)
  [클라별 10B 헤더] u8 type | u32 tick | u32 lastInputTick | i8 phase | u8 flags(bit0 keyframe)
  [그룹 공유 본문] 그룹당 1회만 인코딩 — u16 count + 엔티티별 마스크 필드
  id 0 = 보스. 미포함 = 변화 없음. 퇴장은 leave 이벤트로만.

그 밖의 모든 것(chat/auth/room/race/boss/friend/title …)은 JSON.
연결 직후 서버가 welcome{v:4}. 구 v2/v3 바이너리(MSG_STATE=1)가 오면 kicked{update}.
```

---

## 4. 서버 (`carparty-server/`)

CommonJS · Node 20+ · deps `ws` / `@upstash/redis` / `dotenv`. `npm start` → :3000.

| 파일 | 역할 |
|------|------|
| `server.js` (3222줄) | 전부. HTTP 정적 서빙 + `/healthz` + WS + 틱 루프 + 게임 규칙 + 계정/소셜 |
| `sim.js` (848줄) | **정본 시뮬 코어.** 물리·트랙·충돌·타임어택 상태머신 |
| `paths.js` | `DATA_DIR` / `CLIENT_DIST` 해석 (형제 폴더 후보 3종 탐색) |
| `ta-input.js` | 타임어택 봇 판정 — 조향 입력 패턴 계측 |
| `netbot.js` (575줄) | 헤드리스 봇 하네스. 클라와 동일 파이프라인 + 합성 지연/지터 |
| `tools/`, `scripts/` | 계정·기록·채팅·랭크 조회 CLI (읽기 전용 위주) |

### server.js 의 지형

대략적인 줄 위치 (파일이 크니 이걸로 점프).
**줄번호는 편집할 때마다 밀린다 — 어긋나면 옆의 심볼 이름으로 grep 하라.**

- `~23-120` 상수 (틱레이트, 맵 크기, 스모/펀치, 무적/그레이스)
- `~131-390` 계정 : Redis/파일 저장, scrypt 해시, 토큰, 기록 필드, 통계
- `~389-470` 정적 파일 서버 + `/healthz`
- `~471-500` 프로토콜 상수 (`MSG_INPUT=4`, `MSG_SNAP4=5`, 기아/키프레임/백프레셔)
- `~501-760` v4 코어 : 그룹 판정, `MODE_ENV`, 입력 수신/소화, 스냅샷 인코딩, 타임어택 제출
- `~761-960` **`doTick()` / `simLoop()`** — 여기가 심장
- `~958-1490` WebSocket 연결 핸들러 (JSON 메시지 30여 종 분기) + 하트비트
- `~1492-1610` 판정/브로드캐스트 유틸
- `~1607-2010` 방(pro/rank/casual) 수명주기, 매치메이킹, 점수 반영
- `~2013-2270` 소셜 : 활동 표시, 친구, 귓속말 히스토리, 칭호
- `~2272-2530` 관리자 명령
- `~2529-2680` 프로 레이스 틱(5Hz), 킬 판정, 랙 보상 되감기
- `~2679-3210` 보스전 (아레나·스킬·AI·60Hz `bossTick`) + 스모 틱

### `doTick()` 4단계

1. **그룹 구성** — `mode:<mode>` 또는 `room:<id>`. 그룹 밖(관전/사망 대기)도 입력 링은 소화한다.
2. **입력 소화 + 시뮬** — `SIM.stepGroup(entries, env, {collide, contacts})`.
   충돌 활성: `plaza`/`survival`/`sumo`/`boss` + **레이스 중인 pro 방만**.
3. **규칙 판정** — 히스토리 적립, 타임어택 `attackStep`, 스모 링아웃, 프로 랩 게이트,
   그다음 `runCollisions()`(서바이벌 헤드킬) + `sumoTick()`(펀치).
4. **스냅샷** — 그룹 본문 1회 인코딩 → 클라별 헤더 붙여 전송.

### 계정 · 데이터

- 저장소: `UPSTASH_REDIS_REST_URL/TOKEN` 있으면 Redis(`cargame:user:<id>`), 없으면 `users.json`.
- 비밀번호: 클라가 `sha256("carparty:v1:" + id + pw)` 로 **선해시해 전송** → 서버가 scrypt.
  원문은 서버에 도달하지 않는다. 옛 평문 계정은 로그인 시 자동 이관 + `tools/migrate-passwords.js`.
- 유저 필드: 코스별 최고기록 12종 + `bestBoss`, `rankScore`(기본 100), `proWins/Plays`,
  `casualWins/Plays`, `totalTime`, `streakDays`, `titles[]`/`title`, `friends[]`, `token`.
- 칭호 14종 (`TITLE_DEFS`) — 기록/TOP10/1위/경쟁전 점수/접속시간/연속접속/친구 수.
- 관리자 = `unzzonzz`. 채팅 명령: `/추방` `/차단` `/기록삭제` `/닉변` `/어디` `/온라인`
  `/이벤트` `/점수초기화` `/경쟁전허용|해제|명단` `/랭크`.
- 로그: `chat-log.jsonl`, `ta-suspect.jsonl` (둘 다 `DATA_DIR`, gitignore).

### 게임 모드

`a1 a2 a3` / `racing(B-1) hard(B-2) serp(B-3)` / `c1 c2 c3` / `d1` / `retro1 retro2`
= 타임어택 12종 (충돌 OFF) · `test` 주행 테스트 · `pro` 커스텀/경쟁전/일반전 레이스 ·
`survival` 헤드킬 · `sumo` 링아웃 PvP · `boss` 90초 생존 · `plaza` 사교 공간 ·
`lobby`/`soccer` 는 **로컬 전용**(넷 미사용).

방 종류: `custom`(최대 7) / `rank` 경쟁전(3~5인, 3랩, 6코스, 점수 가감) /
`casual` 일반전(2인 시작, 점수 미변동).

---

## 5. 클라이언트 (`carparty-client/`)

ESM · React 18 + Vite 6 · Node ^20.19 || >=22.12. `npm run dev` → :5173.

| 경로 | 역할 |
|------|------|
| `index.html` + `src/shell.js` | 최상위 셸 — iframe 띄우기, safe-area 측정, 포커스 유지, 하트비트 감시, SW 등록 |
| `play.html` + `src/main.jsx` | 게임 문서. `guard.js` 를 **첫 줄에** import |
| `src/security/guard.js` | 프레임 가드 / 네이티브 선점(WebSocket·시계·rAF) / `isTrusted` 게이트 |
| `src/App.jsx` + `components/` | 무상태 UI 마크업 (모달 9종 포함) |
| `src/game/engine.js` (6880줄) | 렌더·입력·SFX·UI 로직·넷코드 클라 — 사실상 앱 본체 |
| `src/game/sim.js` | **생성물.** 손대지 말 것 |
| `src/hooks/useGameEngine.js` | React 커밋 후 동적 import 로 엔진 부팅 |
| `src/styles/style.css` (1787줄) | 화면·HUD 스타일 |
| `functions/ws.js` | Cloudflare Pages Function — `/ws` → 게임 서버 프록시 |
| `public/_headers` | CSP·보안 헤더·캐시 규칙 (Pages 전용) |
| `public/sw.js` | 서비스워커 — 네트워크 우선, 셸+play 둘 다 캐시 |

### engine.js 지형 (섹션 배너로 나뉜다 — 줄번호는 근사치, 어긋나면 배너 문구로 grep)

`~12` 물리 개요 → `~34` CONFIG → `~48` `WORLD`(모드 정의) → `~94` PALETTE →
`~329` SFX(WebAudio 신디사이저) → `~637` HUD 배치 → `~859` 입력/조작키 →
`~1038` 물리 어댑터(SIM 호출부) → `~1280` 폭발 → `~1352` 스키드 → `~1405` 카메라 →
`~1451` 렌더 → `~1685` 보스 클라 → `~1884` 광장 → `~1904` 스모 → `~2751` 축구(싱글) →
`~3286` 부스트 화염 → `~3902` 멀티플레이(WS 연결·JSON 핸들러) → `~4494` 프로 레이싱 UI →
`~4749` 채팅 → `~4780` 친구 → `~5098` **넷코드 v4 클라** → `~5510` 메인 루프 →
`~5645` 모드 전환/로비 → `~6378` 로그인·대시보드 → `~6785` 터치 조작

메인 루프(`frame()`, ~5525): rAF accumulator 로 정확히 60Hz 만 적분하고,
잔여 dt 는 **사본 상태 + 라이브 키로 렌더 전용 부분 스텝** → 144Hz 에서도 매끈하고
입력 체감 지연 0. 캐치업 상한 6틱.

### 왜 문서가 둘인가 (셸 + 프레임)

개발자도구 콘솔은 기본적으로 최상위 문서에서 평가된다. 게임을 iframe 안에 두면
합성 키를 쏘거나 게임 DOM 을 건드리려 할 때 컨텍스트 전환이 한 단계 더 붙는다.
**벽이 아니라 문턱이다** — 진짜 방어는 서버 권위 시뮬이다.
경계를 넘는 것은 `postMessage` 로만: `?room=` 초대 링크, safe-area(`--sa-*`), 포커스, 하트비트.

---

## 6. 치트 방어 (아래로 갈수록 실제로 막는 힘이 세다)

| 층 | 막는 것 | 위치 |
|----|---------|------|
| iframe 격리 | 콘솔에서 게임 문서 직접 조작 | `shell.js` / `guard.js` |
| CSP `script-src 'self'` | 주입 스크립트·북마클릿·eval | `public/_headers` |
| 난독화 + 소스맵 미배포 | 프로토콜 역독해로 봇 제작 | `vite.config.js` |
| `isTrusted` 게이트 | 페이지 내 스크립트의 합성 키 | `guard.js:realInput` |
| **서버 권위 시뮬** | **속도핵·순간이동·기록 위조 — 프로토콜 수준에서 불가능** | `server.js` + `sim.js` |
| `ta-input.js` | 남은 구멍 하나 = 봇(사람 대신 프로그램이 버튼) | 서버 |

`ta-input.js` 판정: 계측 주행 동안 조향 홀드 길이(`FLICK_TICKS 3`)와 전환 빈도를 센다.
`flipRate ≥16 && flickFrac ≥0.50` → **suspect**(저장 + `ta-suspect.jsonl` + 관리자 알림),
`≥25 && ≥0.75` → **impossible**(기록 반려). 표본 `MIN_HOLDS 20` 미만이면 언제나 ok.
자동밴은 없다 — 제재는 관리자 수동. 오탐이 치터 한 명 놓치는 것보다 손해라는 판단.

난독화 옵션 선택 이유(`vite.config.js` 주석에 상세): `controlFlowFlattening` 은 60Hz
루프를 느리게 해서 끄고, `numbersToExpressions` 는 `sim.js` 결정론을 깰 수 있어 끈다.
난독화는 `generateBundle` 단계에서 돈다 (`renderChunk` 에서 하면 청크 파일명
자리표시자가 문자열 배열로 빨려 들어가 동적 import 가 404 난다).

---

## 7. 실행 · 배포

```bash
# 서버
cd carparty-server && npm install && npm start          # :3000

# 클라 (다른 터미널)
cd carparty-client && npm install && npm run dev        # :5173, /ws 를 :3000 으로 프록시
GAME_SERVER=wss://api.wkrdjqtlf.work/carparty-io npm run dev   # 원격 서버에 붙기

# 빌드
npm run build                       # 난독화 + devtools 방해 + console 제거
NO_OBFUSCATE=1 npm run build        # 배포본 디버깅
npx vite build --mode development   # console 남기기

# 넷코드 실측
node netbot.js ws://localhost:3000 40 10        # 직선/전환 (RTT 80ms)
node netbot.js ws://localhost:3000 40 10 sumo   # 그라인딩
```

`/ws` 는 브라우저 입장에선 **언제나 같은 오리진**이고, 실제 서버로 넘기는 주체만 환경마다 다르다:

| 환경 | 넘기는 주체 | 설정 |
|------|-------------|------|
| 개발 | Vite 프록시 | `GAME_SERVER` |
| Cloudflare Pages | `functions/ws.js` | `GAME_SERVER_URL` (기본 `https://api.wkrdjqtlf.work/carparty-io`) |
| Render Static | 없음(프록시 불가) | `VITE_WS_URL` 필수 |
| 서버가 직접 서빙 | 없음 | 서버가 `/ws` 를 스스로 받음 |

**Pages 배포에는 `VITE_WS_URL` 을 넣지 않는다** — 넣으면 Function 프록시를 우회한다.

서버는 Render Blueprint(`render.yaml`, 싱가포르 리전, free 플랜, `healthCheckPath: /healthz`).
free 플랜은 15분 미접속 시 잠들고 콜드스타트가 수십 초 — 클라에 자동 재접속이 있다.
**게임 서버는 Cloudflare Workers 로 못 옮긴다**: `ws` 패키지, 모듈 최상단 `setInterval`
60Hz 루프, 전 접속 공유 메모리 상태, `fs`, `crypto.scryptSync` 가 전부 실행 모델과 안 맞는다
(서버 README 에 표로 정리되어 있다).

배포는 **pull + restart 한 번에**. 구 클라는 접속 시 `kicked{update}` 를 받고
세션당 1회 캐시버스팅 새로고침을 한다.

---

## 8. 알아 두면 좋은 함정 / 현재 상태의 어긋난 부분

작업 중 마주칠 수 있는 것들. (분석 시점 2026-08-27)

1. ~~`wrangler.jsonc` 주석이 VITE_WS_URL 을 "반드시 넣으라"고 지시~~ → **수정됨**
   (2026-08-27). Pages 에서는 **넣지 않는다** — 넣으면 `functions/ws.js` 프록시를 우회한다.
   업스트림 변경은 `GAME_SERVER_URL`.
2. ~~`engine.js` 멀티플레이 배너가 v3 설명~~ → **수정됨** (2026-08-27). 배너·`remotePlayers`
   주석·고아로 남아 있던 v3 "바이너리 프로토콜" 배너를 v4 기준으로 정리했다.
3. ~~`render.yaml` 의 SPA 폴백~~ → **수정됨** (2026-08-27). `routes` 블록을 제거했다.
   경로 라우팅을 안 쓰고 게임 문서도 실제 파일 `/play.html` 이라 폴백이 필요 없고,
   걸어 두면 없는 `.js` 요청에 HTML 200 이 돌아와 서비스워커 캐시가 오염된다.
4. ~~`MSG_SNAPSHOT`/`MSG_SNAPSHOT3` 죽은 상수~~ → **수정됨** (2026-08-27). 같은 블록의
   죽은 헬퍼(`rgbToHex`·`sendBin`)와 함께 제거했다. 살아남은 `MSG_STATE` 는 "구 클라 감지
   → `kicked{update}`" 전용이고, 그 이유가 주석으로 붙어 있다.
5. ~~클라의 `net.pendingTeleport` (쓰기 전용)~~ → **수정됨** (2026-08-27). 선언 1줄 + 대입
   8줄 제거. 텔레포트는 서버 `spawn` 이벤트가 처리한다.
   `net` 에 아직 쓰기 전용 필드가 셋 남아 있다 — `rttMs` · `lastSnapAt` · `lastInputAck`.
   넷코드 계측값이라 디버그 HUD 자리로 남겨둔 것일 수 있어 손대지 않았다
   (`lastSnapTick` 은 `sendInputFrame` 이 읽으므로 살아 있다).
5. **스냅샷 델타 마스크는 프로토콜에만 있고 지금은 전 필드를 매 틱 보낸다.**
   대역이 목표(8인 하향 <15KB/s) 안이라 최적화를 보류한 의도된 편차 (`NETCODE.md` §11).
6. **미구현으로 남은 설계**: TAS 입력 스트림 영속 + 신기록 재시뮬 검증(§7),
   `stepBoss`/`bossCmd` 공유화(보스는 현재 ballistic 외삽), §8 의 시점 재구성 랙 보상
   (현재 고정 35ms 되감기), 카메라 스프링(현재 하드락).
7. **타임어택 기록은 서버 틱 산출**(16.7ms 그레인)이라 클라 HUD 표시(로컬 ms)와
   최대 1틱 차이날 수 있다. `timeAttack` 메시지는 서버가 무시한다.
8. 데이터 파일(`users.json`, `chat-log.jsonl`, `ta-suspect.jsonl`)은 gitignore 되어 있고
   지금 워크스페이스에는 없다. 로컬에서 계정 기능을 만지려면 서버를 한 번 띄워 만들어야 한다.

---

## 9. 작업 요령

- **물리/충돌/트랙을 고친다** → `carparty-server/sim.js` 만 고치고, 클라에서 `npm run sync:sim`.
  고치기 전에 `NETCODE.md` §5 를 읽고, 고친 뒤 `netbot.js` 로 보정률/시점차를 재본다.
- **넷코드 파라미터를 만진다** → 서버 `server.js:489-497`, 클라 `engine.js:5110-5150`.
  양쪽 상수가 짝을 이룬다(예: 클라 `MAX_LEAD 20` ↔ 서버 `MAX_LEAD_TICKS 24`).
- **새 모드를 넣는다** → `sim.js` 의 `WORLD_DIMS`, 서버 `MODE_ENV`/`COLLIDE_MODES`,
  클라 `WORLD`/`startGame`/`clientCollideOn` 을 함께 건드려야 한다.
- **UI 를 넣는다** → 마크업은 `components/` 의 JSX(무상태), 채우고 보이고 숨기는 로직은
  `engine.js` 에서 `id` 로 잡아 명령형으로. 새 요소에는 안정적인 `id` 를 준다.
- **커밋** → 두 repo 가 별개다. 한 변경이 양쪽에 걸치면 커밋도 두 번,
  배포도 같이 나가야 한다(프로토콜 변경은 특히).
