import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import JavaScriptObfuscator from "javascript-obfuscator";

/* 클라이언트는 언제나 같은 오리진의 `/ws` 로 접속한다(engine.js connect()).
 * 그 `/ws` 를 실제 게임 서버로 넘기는 일은 환경마다 다른 주체가 맡는다:
 *
 *   개발      Vite 개발 서버   → 아래 proxy 설정
 *   Pages     Pages Function   → functions/ws.js
 *   서버 직접 서빙  해당 없음    → 서버가 /ws 를 스스로 받는다
 *
 * 어느 쪽이든 브라우저가 보는 주소는 `/ws` 로 같아서, VITE_WS_URL 을 굳이
 * 지정할 필요가 없다(지정하면 그 주소로 직접 붙는다 — 프록시 우회).
 *
 * GAME_SERVER 는 경로까지 포함한 전체 URL 이다. 게임 서버마다 WebSocket 경로가
 * 다르기 때문이다 — 로컬 서버는 아무 경로나 받지만 운영은 /carparty-io 다.
 */
const GAME_SERVER = process.env.GAME_SERVER || "ws://localhost:3000/ws";
const gameServer = new URL(GAME_SERVER);

// http-proxy 는 타깃 프로토콜이 http:/https: 일 때만 TLS 여부를 제대로 고른다.
// wss: 를 그대로 주면 평문으로 443 에 붙어 연결이 즉시 끊긴다.
const HTTP_SCHEME = { "ws:": "http:", "wss:": "https:" };
const proxyTarget =
  `${HTTP_SCHEME[gameServer.protocol] ?? gameServer.protocol}//${gameServer.host}`;

/* =============================================================================
 *  난독화 (프로덕션 빌드 전용)
 * -----------------------------------------------------------------------------
 *  목적은 "읽고 고치기 어렵게" 다. 결정된 코드를 되돌릴 수 없게 만드는 건
 *  불가능하니, 기대치는 분명히 해 두자 — 넷코드 프로토콜을 읽어내 봇을 짜거나
 *  주행 로직에 패치를 얹는 비용을 크게 올리는 것까지다. 위치가 아니라 버튼만
 *  보내는 서버 권위 구조(NETCODE.md)가 여전히 진짜 방어선이다.
 *
 *  옵션을 왜 이렇게 골랐나 — 이 코드베이스에는 두 가지 제약이 있다.
 *
 *  1) 60Hz 물리 루프가 돈다.
 *     controlFlowFlattening 은 핫 루프를 몇 배 느리게 만든다. deadCodeInjection
 *     은 번들만 불린다. 둘 다 끈다. 남기는 것은 실행 비용이 거의 없는 식별자
 *     리네이밍과 문자열 배열이다.
 *
 *  2) sim.js 는 서버와 부동소수점까지 똑같이 돌아야 한다.
 *     한 틱이라도 결과가 갈리면 넷코드가 깨진다. 그래서 숫자 리터럴을 식으로
 *     바꾸는 numbersToExpressions 를 끈다 (0.5 → (0.25+0.25) 같은 변형은
 *     대개 같은 값이지만, 연산 순서가 바뀌는 순간 마지막 비트가 달라진다).
 *
 *  NO_OBFUSCATE=1 로 끄면 난독화 없이 빌드한다 (배포본 디버깅용).
 *  NO_DEVTOOLS_TRAP=1 은 개발자도구 방해(debugger 루프)만 끈다.
 */
const OBFUSCATE = process.env.NO_OBFUSCATE !== "1";
const DEVTOOLS_TRAP = process.env.NO_DEVTOOLS_TRAP !== "1";

const OBFUSCATOR_OPTIONS = {
  target: "browser",
  compact: true,
  // --- 실행 비용이 거의 없는 것들 (켠다) ---
  identifierNamesGenerator: "mangled-shuffled",
  simplify: true,
  stringArray: true,
  stringArrayThreshold: 0.8,
  stringArrayEncoding: ["base64"],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayIndexShift: true,
  stringArrayWrappersType: "function",
  stringArrayWrappersCount: 2,
  // 예쁘게 포매팅해서 읽으려 하면 코드가 스스로 망가진다
  selfDefending: true,
  // 개발자도구를 열어 두면 debugger 루프에 걸려 단계 실행이 사실상 불가능해진다.
  // 열지 않은 평상시에는 비용이 없다.
  debugProtection: DEVTOOLS_TRAP,
  debugProtectionInterval: DEVTOOLS_TRAP ? 4000 : 0,
  // --- 느려지거나 위험한 것들 (끈다) ---
  controlFlowFlattening: false, // 60Hz 물리 루프가 느려진다
  deadCodeInjection: false,     // 번들만 커진다
  numbersToExpressions: false,  // sim.js 의 결정론이 깨질 수 있다
  splitStrings: false,          // 문자열 결합 비용
  transformObjectKeys: false,   // 속성 조회에 간접층이 하나 더 붙는다
  unicodeEscapeSequence: false, // 한글 주석/문자열이 많아 크기가 급증한다
  renameGlobals: false,         // 전역을 바꾸면 브라우저 API 를 못 찾는다
  disableConsoleOutput: false,  // console 은 esbuild drop 으로 이미 지운다
};

/* 청크 단위 난독화.
 *  · react/react-dom(vendor) 은 건너뛴다 — 어차피 공개된 코드고, 넣으면 빌드
 *    시간과 번들만 늘어난다. 감출 값어치가 있는 건 우리 엔진 쪽이다.
 *  · 소스맵은 프로덕션에서 아예 만들지 않으므로 매핑을 이어붙일 필요가 없다.
 *
 *  renderChunk 가 아니라 generateBundle 에서 돌리는 이유 (중요) :
 *   renderChunk 단계의 코드에는 청크 파일명이 아직 자리표시자로 들어 있다
 *   (`import("./assets/engine-!~{005}~.js")`). Rollup 은 그 뒤에 이 토큰을
 *   실제 해시 파일명으로 치환하는데, 난독화가 문자열을 배열로 빼내 base64 로
 *   감싸 버리면 토큰이 사라져 치환이 안 된다 → 동적 import 가
 *   `engine-!~%7B005%7D~.js` 를 받으러 가서 404, 엔진이 통째로 안 뜬다.
 *   stringArrayThreshold 가 확률이라 빌드마다 되기도 안 되기도 해서 더 고약하다.
 *   generateBundle 은 파일명이 다 확정된 뒤라 이 문제가 없다. */
function obfuscate() {
  return {
    name: "carparty-obfuscate",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      if (!OBFUSCATE) return;
      for (const [fileName, out] of Object.entries(bundle)) {
        if (out.type !== "chunk") continue;
        if (!/\.(js|mjs)$/.test(fileName)) continue;
        if (out.name === "vendor") continue;
        out.code = JavaScriptObfuscator.obfuscate(out.code, OBFUSCATOR_OPTIONS).getObfuscatedCode();
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), obfuscate()],
  server: {
    port: 5173,
    // 같은 네트워크의 다른 기기/휴대폰에서 접속해 테스트할 수 있게 개방
    host: true,
    proxy: {
      "/ws": {
        target: proxyTarget,
        ws: true,
        rewriteWsOrigin: true,
        // 원격 서버는 대개 가상호스팅 뒤에 있어 Host 를 업스트림 기준으로 바꿔야 한다
        changeOrigin: true,
        // 운영(Pages Function)과 동일하게 경로까지 바꿔준다.
        // 이게 없으면 원격 서버에 붙일 때 /ws 그대로 가서 502 가 난다.
        rewrite: () => gameServer.pathname,
      },
    },
  },
  esbuild: {
    // 배포본에 console/debugger 를 남기지 않는다. 로그는 내부 동작을 그대로
    // 설명해 주는 최고의 문서라, 난독화를 해도 이게 남으면 반쯤 헛일이다.
    //  `vite build --mode development` 로는 로그를 남긴 채 빌드할 수 있다
    //  (NO_OBFUSCATE=1 과 함께 쓰면 배포 산출물을 그대로 디버깅할 수 있다).
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    outDir: "dist",
    // 소스맵은 배포하지 않는다. 난독화를 해 놓고 원본 대조표를 같이 올리면
    // 아무 의미가 없다 — 예전엔 배포본 스택트레이스를 읽으려고 켜 뒀지만,
    // 그 편의가 곧 "코드 고쳐 쓰세요" 안내였다.
    // 필요하면 sourcemap: "hidden" 으로 바꿔 파일만 만들고 따로 보관한다.
    sourcemap: false,
    rollupOptions: {
      // 문서가 둘이다 : index.html = 셸, play.html = iframe 안의 게임 본체
      input: {
        index: "index.html",
        play: "play.html",
      },
      output: {
        // 난독화에서 제외할 수 있게 서드파티를 한 청크로 모은다
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
}));
