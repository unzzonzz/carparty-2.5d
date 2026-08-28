# CarParty.io — 클라이언트

탑뷰 슈퍼카 레이싱 게임 [CarParty.io](https://github.com/) 의 웹 클라이언트.
React + Vite 로 만든 UI 셸과, HTML5 Canvas 물리/렌더 엔진으로 이뤄져 있다.

게임 서버는 별도 repo다 → **carparty-server** (Node.js + WebSocket)

## 조작

| 키 | 동작 |
|----|------|
| `W` / `↑` | 가속 |
| `A` `D` / `←` `→` | 좌 / 우 회전 |
| `S` / `↓` | 후진 |
| `SPACE` | 브레이크 |
| `M` | 음소거 |
| `Enter` | 채팅 |

WASD 와 방향키가 **둘 다** 동작한다. 설정 → **조작키** 에서 한쪽만 쓰도록
좁힐 수 있다 (WASD / 방향키 / 둘 다). 브레이크는 어느 쪽이든 `SPACE` 다.

## 실행

```bash
npm install
npm run dev        # → http://localhost:5173
```

멀티플레이를 하려면 **carparty-server** 를 `localhost:3000` 에 띄워둔다.
Vite 가 `/ws` 를 그쪽으로 프록시한다. 서버가 다른 곳에 있으면:

```bash
GAME_SERVER=wss://api.wkrdjqtlf.work/carparty-io npm run dev
```

빌드:

```bash
npm run build      # → dist/
```

## 구조

| 경로 | 역할 |
|------|------|
| `index.html`, `src/shell.js` | 최상위 셸 — 게임 문서를 iframe 으로 띄우는 껍데기 |
| `play.html`, `src/main.jsx` | 게임 문서 — 프레임 안에서 도는 본체 |
| `src/security/guard.js` | 프레임 가드 · 네이티브 선점 · 합성 입력 차단 |
| `src/App.jsx`, `src/components/` | UI 셸 — HUD · 로비 · 채팅 · 모달 마크업 (React) |
| `src/game/engine.js` | 차량 물리 · 캔버스 렌더 · WebSocket 클라이언트 |
| `src/game/sim.js` | 결정론 시뮬 코어 — **서버 repo 에서 복제된 생성물** |
| `src/hooks/useGameEngine.js` | React 마운트 후 엔진 부팅 |
| `src/styles/style.css` | 화면 · HUD 스타일 |

### 문서가 둘인 이유 (셸 + 프레임)

브라우저가 여는 것은 `index.html` 이지만, 게임은 그 안의 iframe 에 뜬 `play.html`
에서 돈다. 개발자도구 콘솔은 기본적으로 최상위 문서 컨텍스트에서 평가되므로,
게임을 한 겹 안에 두면 콘솔로 합성 키를 쏘거나 게임 DOM 을 건드리려 할 때
컨텍스트를 프레임으로 바꾸는 단계가 하나 더 붙는다. 셸에 외부 스크립트를 붙일
일이 생겨도 게임 문서와 전역을 공유하지 않는다.

**프레임은 벽이 아니라 문턱이다.** 진짜 방어는 서버가 한다 — 클라는 위치가 아니라
버튼 비트만 보내고 물리도 기록도 서버가 계산한다. 아래 "치트 방어" 참고.

경계를 넘겨야 하는 것들은 `postMessage` 로 오간다.

| 넘기는 것 | 이유 |
|------|------|
| `?room=` | 초대 링크. 셸이 프레임 `src` 로 전달하고 최상위 주소에선 지운다 |
| safe-area | `env(safe-area-inset-*)` 는 최상위 뷰포트 기준이라 프레임 안에선 0 이다. 셸이 재서 `--sa-*` 로 넘긴다 (CSS 는 이 변수만 쓴다) |
| 포커스 | 키 이벤트는 포커스된 문서에만 간다. 셸이 프레임을 계속 잡아둔다 |
| 하트비트 | 프레임이 조용해지면 셸이 다시 띄운다 |

### React 와 캔버스 엔진의 경계

React 는 **화면의 뼈대만** 그린다. 그 안을 채우고 보이고 숨기는 일은 캔버스
엔진이 `id` 로 요소를 잡아 명령형으로 처리한다. 60Hz 로 도는 물리/렌더 루프를
React 상태에 태우면 프레임마다 리렌더가 돌아 오히려 느리기 때문이다.

그래서 `App` 트리에는 상태가 없다. 최초 1회 마운트 후 React 는 DOM 을 다시
건드리지 않으므로, 엔진이 넣은 자식(채팅 줄 · 순위 행 · 칭호 칩 …)도 안전하다.
엔진은 React 가 DOM 을 커밋한 뒤 `useGameEngine` 의 동적 import 로 부팅된다.

### src/game/sim.js 를 직접 고치지 말 것

넷코드는 "클라와 서버가 **완전히 같은 코드**로 물리를 적분한다"가 전제다.
정본은 `carparty-server/sim.js` 이고, 이 파일은 거기서 복제된 생성물이다.
`predev` / `prebuild` 가 자동으로 동기화하므로 보통 신경 쓸 일은 없다.

두 repo 를 형제 폴더로 두면 기본 경로로 찾는다. 아니면:

```bash
SIM_SOURCE=/path/to/carparty-server/sim.js npm run sync:sim
```

서버 repo 가 없으면 커밋된 사본을 그대로 쓰고 경고만 남긴다 — 이 repo 만
클론해도 빌드는 된다.

## 치트 방어

층은 넷이고, **아래로 갈수록 실제로 막는 힘이 세다.** 위쪽 셋은 비용을 올리는
문턱이지 벽이 아니다.

| 층 | 무엇을 막나 |
|----|------|
| iframe 격리 | 콘솔에서 게임 문서에 곧장 손대는 것 (위 "문서가 둘인 이유") |
| 난독화 + 소스맵 미배포 | 넷코드 프로토콜을 읽어내 봇을 짜거나 주행 로직에 패치를 얹는 것 |
| `isTrusted` 게이트 | 페이지 안 스크립트가 만든 합성 키로 차를 모는 것 |
| **서버 권위 시뮬** | 속도핵 · 순간이동 · 기록 위조 — **프로토콜 수준에서 불가능** |

클라가 보내는 것은 위치가 아니라 버튼 비트뿐이고, 물리도 기록도 서버가 자기
시뮬로 계산한다. 그래서 남는 치트는 "사람 대신 프로그램이 버튼을 누르는 것"
하나이고, 그건 서버 쪽 `ta-input.js` 가 입력 패턴으로 가른다
(**carparty-server** README 의 "기록 위조 방어").

### 빌드 플래그

난독화는 `vite build` 에서만 돌고 개발 서버에는 영향이 없다.

```bash
npm run build                    # 난독화 + 개발자도구 방해 + console 제거
NO_OBFUSCATE=1 npm run build     # 난독화 끄기 (배포본 디버깅)
NO_DEVTOOLS_TRAP=1 npm run build # 개발자도구 방해(debugger 루프)만 끄기
npx vite build --mode development  # console 로그를 남긴 채 빌드
```

옵션 선택 이유는 [`vite.config.js`](vite.config.js) 주석에 적어 뒀다. 요점 둘:
**60Hz 물리 루프가 있어** 실행이 느려지는 변환(controlFlowFlattening)은 끄고,
**`sim.js` 는 서버와 부동소수점까지 같아야 해서** 숫자 리터럴을 건드리는
변환(numbersToExpressions)도 끈다.

소스맵은 프로덕션에서 만들지 않는다. 난독화해 놓고 원본 대조표를 같이 올리면
아무 의미가 없다. 배포본 스택트레이스를 읽어야 하면 `sourcemap: "hidden"` 으로
바꿔 파일만 만들고 따로 보관한다.

## 배포

정적 사이트다. `npm run build` 결과인 `dist/` 를 올리면 된다.

### WebSocket 이 서버까지 가는 경로

클라이언트는 **언제나 같은 오리진의 `/ws`** 로 접속한다. 그 `/ws` 를 실제 게임
서버로 넘기는 일은 환경마다 다른 주체가 맡는다.

| 환경 | `/ws` 를 넘기는 주체 |
|------|------|
| 개발 (`npm run dev`) | Vite 개발 서버 프록시 — `GAME_SERVER` 로 대상 지정 |
| Cloudflare Pages | [`functions/ws.js`](functions/ws.js) — `GAME_SERVER_URL` 로 대상 지정 |
| 서버가 직접 서빙 | 없음. 서버가 `/ws` 를 스스로 받는다 |

셋 다 브라우저가 보는 주소는 `/ws` 로 같아서 **`VITE_WS_URL` 은 지정하지 않는다.**
지정하면 프록시를 건너뛰고 그 주소로 직접 붙는다 — 프록시를 안 쓰는 호스팅에
올릴 때만 쓰는 탈출구다.

### Cloudflare Pages

설정은 [`wrangler.jsonc`](wrangler.jsonc), [`public/_headers`](public/_headers),
[`functions/ws.js`](functions/ws.js) 에 들어 있다.

**대시보드 Git 연동 (권장)** — Workers & Pages → Create → Pages →
이 repo 연결 후:

| 항목 | 값 |
|------|-----|
| Build command | `npm run build` |
| Build output directory | `dist` |
| 환경변수 `NODE_VERSION` | `22.12.0` |
| 환경변수 `GAME_SERVER_URL` | `https://api.wkrdjqtlf.work/carparty-io` (선택 — 기본값과 같으면 생략) |

`VITE_WS_URL` 은 **넣지 않는다.** 넣으면 `functions/ws.js` 프록시를 우회한다.

**수동 배포**

```bash
npx wrangler login
npm run build
npx wrangler pages deploy
```

**로컬에서 운영과 똑같이 확인** (Function 포함, workerd 로 실행)

```bash
npm run build && npx wrangler pages dev
```

`_redirects` 는 두지 않았다. 이 앱은 경로 라우팅을 쓰지 않고 방 초대도
쿼리(`?room=`)라 SPA 폴백이 필요 없다. 오히려 `/* /index.html 200` 을 넣으면
없는 `.js` 요청에 HTML 이 200 으로 돌아와 서비스워커 캐시가 오염된다.
WebSocket 프록시도 `_redirects` 로는 안 된다 — 101 업그레이드를 다루지 못해서
Pages Function 이 필요하다.

> **게임 서버 자체는 Cloudflare 에 올라가지 않는다.** WebSocket 을 물고 60Hz 로
> 도는 상태 있는 Node 프로세스라 Workers 실행 모델과 맞지 않는다. 서버는 따로
> 두고 `functions/ws.js` 가 그쪽으로 프록시할 뿐이다.
> 자세한 이유는 서버 repo 의 README 참고.
