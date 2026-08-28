# CarParty.io — 서버

탑뷰 슈퍼카 레이싱 게임 [CarParty.io](https://github.com/) 의 게임 서버.
WebSocket 릴레이 + **서버 권위 60Hz 고정틱 시뮬레이션**을 담당한다.

클라이언트는 별도 repo다 → **carparty-client** (React + Vite)

## 실행

```bash
npm install
npm start          # → http://localhost:3000
```

`http://localhost:3000` 은 클라이언트 빌드가 있을 때만 화면이 나온다.
없으면 WebSocket 전용으로 동작하고 시작 시 경고를 찍는다.

개발할 때는 클라이언트 repo 에서 `npm run dev` (Vite :5173) 를 띄우면 되고,
Vite 가 `/ws` 를 이 서버로 프록시한다. 이 서버는 그냥 켜두면 된다.

## 환경변수

| 이름 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | 수신 포트 |
| `DATA_DIR` | repo 루트 | `users.json` · `chat-log.jsonl` 저장 위치 |
| `CLIENT_DIST` | `../carparty-client/dist` | 정적 서빙할 클라이언트 빌드 |
| `UPSTASH_REDIS_REST_URL` | — | 있으면 계정/통계를 Redis 에 영속 (없으면 파일 폴백) |
| `UPSTASH_REDIS_REST_TOKEN` | — | 위와 같이 설정 |

`.env` 파일이 있으면 자동으로 읽는다.

## 구조

| 파일 | 역할 |
|------|------|
| `server.js` | WebSocket 릴레이 + 권위 시뮬 + 정적 서빙 |
| `sim.js` | **결정론 고정틱 시뮬 코어 (정본)** — 클라이언트가 이 파일을 복제해 쓴다 |
| `paths.js` | 데이터 파일 / 클라이언트 빌드 경로 |
| `ta-input.js` | 타임어택 기록의 봇 판정 — 조향 입력 패턴 계측 |
| `netbot.js` | 넷코드 측정용 헤드리스 봇 (`npm run netbot`) |
| `tools/`, `scripts/` | 계정·기록·채팅 로그 조회 등 운영용 CLI |

### sim.js 가 정본인 이유

넷코드 v4 는 "클라와 서버가 **완전히 같은 코드**로 물리를 적분한다"가 전제다
([NETCODE.md](NETCODE.md) §5). repo 가 둘로 갈라진 뒤에도 이 조건을 지키려고
판정 권위가 있는 서버 쪽을 정본으로 두었다.

**물리를 고쳤으면 클라이언트 쪽도 동기화해야 한다.** 두 repo 를 형제 폴더로
두고 클라이언트에서:

```bash
npm run sync:sim
```

클라이언트의 `predev` / `prebuild` 가 이걸 자동 실행하므로, 보통은 클라이언트를
빌드하거나 개발 서버를 띄우면 알아서 맞춰진다.

## 배포 (Render)

[`render.yaml`](render.yaml) Blueprint 가 포함되어 있다. 대시보드에서
**New +** → **Blueprint** 로 이 repo 를 연결하면 Web Service 가 생성된다.

> **무료 플랜 주의:** 15분 미접속 시 잠들고 콜드스타트가 수십 초 걸린다.
> 클라이언트에 자동 재접속 로직이 있어 깨어날 때 알아서 다시 연결된다.

클라이언트를 정적 호스팅(Cloudflare Pages, Render Static Site 등)에 따로 올릴
경우, 클라이언트 빌드에 `VITE_WS_URL=wss://<서비스명>.onrender.com/ws` 를 넣어야 한다.

## 왜 이 서버는 Cloudflare Workers 에 못 올리나

클라이언트는 Cloudflare Pages 로 잘 올라가지만, **이 서버는 Workers 로 그대로
옮길 수 없다.** 설정 문제가 아니라 실행 모델이 달라서다.

| 이 서버가 하는 일 | Workers 에서의 문제 |
|---|---|
| `new WebSocketServer({ server })` (`ws` 패키지) | Workers 는 `WebSocketPair` 라는 다른 API 를 쓰고, 연결을 붙들려면 Durable Object 가 필요하다 |
| 모듈 최상단 `setInterval` 루프 (보스 60Hz, 프로 5Hz, 하트비트, 인원 브로드캐스트) | 요청 사이에 살아 있는 프로세스가 없다. Durable Object 알람으로 흉내내야 하는데 60Hz 는 현실적이지 않다 |
| 전 접속을 공유하는 메모리 상태 (`players` Map, 방/레이스) | 인스턴스가 요청마다 갈릴 수 있어 단일 Durable Object 로 몰아야 한다 |
| `fs` 로 users.json · chat-log.jsonl 읽고 쓰기 | 파일시스템이 없다 (Upstash Redis 경로는 그대로 쓸 수 있다) |
| `crypto.scryptSync` | workerd 에 없다 |

즉 서버 대부분을 Durable Objects 기준으로 다시 쓰는 작업이고, 60Hz 권위
시뮬레이션은 지속 CPU 를 먹어 Workers 과금 모델과도 잘 안 맞는다.

현실적인 선택지:

1. **서버는 Render 에 두고 클라만 Pages 에 올린다** (권장, 지금 구조 그대로)
2. Cloudflare 를 앞단에 두고 싶으면 서버 도메인을 Cloudflare DNS 에 프록시로
   올린다 — WebSocket 프록시를 지원하므로 CDN·DDoS 보호는 받으면서 서버는
   그대로 둘 수 있다
3. 자체 서버(학교 서버 등)를 노출하려면 Cloudflare Tunnel 을 쓴다

## 넷코드

입력만 올려보내고 서버가 60Hz 로 전 차량을 적분해 정본 스냅샷을 브로드캐스트한다.
클라는 로컬 예측 + reconciliation 으로 지연을 숨긴다.
자세한 설계는 [NETCODE.md](NETCODE.md).

## 기록 위조 방어

클라가 위치가 아니라 **버튼 비트만** 보내므로 속도핵·순간이동·기록 위조는
프로토콜 수준에서 이미 불가능하다(`timeAttack` 메시지는 무시된다). 물리도 기록도
서버가 자기 시뮬로 계산한다.

남는 구멍은 **봇**뿐이다 — 규칙은 안 어기고 사람이 못 내는 정밀도로 몰 뿐이다.
[`ta-input.js`](ta-input.js) 가 계측 주행 동안의 조향 입력을 세서, 손가락으로는
낼 수 없는 패턴(1~2틱짜리 조향의 연속, 초당 수십 번의 전환)을 가른다.

| 판정 | 처리 |
|------|------|
| `ok` | 그대로 저장 |
| `suspect` | 저장하되 `ta-suspect.jsonl` 에 기록 + 접속 중인 관리자에게 알림 |
| `impossible` | 기록을 저장하지 않음. 로그 + 관리자 알림 + 본인 통지 |

임계값은 `ta-input.js` 상단에 모여 있다. 오탐이 치터 한 명 놓치는 것보다 훨씬
손해라 사람이 도달 가능한 값에는 손대지 않게 잡았고, 실제 `ta-suspect.jsonl` 을
보고 조이거나 풀면 된다. 제재는 지금까지처럼 관리자 수동 판단이다
(`/기록삭제` · `/추방` · `/차단`).

> 서버 코드 난독화는 하지 않는다. 이 코드는 브라우저로 내려가지 않아 감출 대상이
> 아니고, 난독화하면 운영 중 스택트레이스만 못 읽게 된다. 클라이언트로 내려가는
> `sim.js` 는 클라이언트 빌드에서 번들과 함께 난독화된다.
