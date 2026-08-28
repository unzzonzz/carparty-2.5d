/* =============================================================================
 *  guard.js — 게임 문서(play.html)가 제일 먼저 평가하는 모듈.
 * -----------------------------------------------------------------------------
 *  하는 일은 세 가지다. 셋 다 "탐지해서 제재"가 아니라 "애초에 안 먹히게" 쪽이다.
 *  탐지형(순간이동 감지·개발자도구 감지 같은 것)은 오탐이 나면 정상 플레이어를
 *  쫓아내는데, 정작 진짜 치터는 코드를 지우면 그만이라 남는 게 손해뿐이다.
 *
 *   1) 프레임 가드   이 문서는 셸(index.html)의 iframe 안에서만 돈다.
 *                    주소창으로 직접 열면 셸로 되돌린다.
 *   2) 네이티브 선점 WebSocket · 시계 · rAF 의 "때 묻지 않은" 참조를 모듈 평가
 *                    시점에 붙잡아 둔다. 나중에 누가 WebSocket.prototype.send 를
 *                    가로채도 엔진이 쓰는 통로는 원본 그대로다.
 *   3) 합성 입력 차단 스크립트가 만든 키 이벤트(isTrusted === false)는 주행 키로
 *                    치지 않는다. 콘솔 한 줄로 차를 모는 가장 쉬운 길이 막힌다.
 *
 *  진짜 방어선은 여기가 아니라 서버다 — 클라는 위치가 아니라 "버튼 비트"만
 *  보내고(engine.js MSG_INPUT), 물리도 기록도 서버가 자기 시뮬로 계산한다.
 *  이 파일은 그 위에 얹는 문턱이다. 자세한 배경은 src/shell.js 주석 참고.
 * ========================================================================== */

/* --- 1) 프레임 가드 --------------------------------------------------------
 *  최상위로 열렸으면 셸로 되돌린다(초대 링크 쿼리는 유지). replace 라 뒤로가기
 *  루프가 생기지 않는다. 리다이렉트 뒤에도 이 모듈의 나머지는 계속 평가되지만,
 *  곧 문서가 날아가므로 문제되지 않는다. */
export const framed = window.self !== window.top;
if (!framed) location.replace(import.meta.env.BASE_URL + location.search);

/* --- 2) 네이티브 선점 ------------------------------------------------------
 *  모듈 최상단 = 엔진보다 먼저 평가된다(main.jsx 가 이 모듈을 첫 줄에 import).
 *  bind 로 떠 두면 나중에 전역이 바뀌어도 우리 쪽 호출은 원본을 탄다. */
export const NativeWebSocket = window.WebSocket;
export const nowHi = performance.now.bind(performance);   // 단조 시계 (프레임/보간)
export const nowMs = Date.now.bind(Date);                 // 벽시계 (서버 시각 동기)
export const raf = requestAnimationFrame.bind(window);

/* 프로토타입을 얼려 send/onmessage 후킹을 막는다. 확장 프로그램이 여기에
 * 덧씌우려다 실패할 수는 있어도, 실패는 저쪽 스크립트에서 나고 게임은 계속 돈다. */
try { Object.freeze(WebSocket.prototype); } catch {}
try { Object.freeze(WebSocket); } catch {}

/* --- 3) 합성 입력 차단 -----------------------------------------------------
 *  isTrusted 는 "사용자 조작이 만든 이벤트인가"다. dispatchEvent 로 만든 건
 *  false 라서 페이지 안 스크립트의 자동 주행이 걸러진다. OS 레벨 매크로나
 *  화면 키보드는 여전히 true 이므로 정상 플레이어가 막히는 일은 없다.
 *
 *  터치 컨트롤은 키 이벤트를 거치지 않고 keys[] 를 직접 세우므로 무관하다.
 *  개발/배포에서 똑같이 건다 — 개발에서만 풀어 두면 정작 막히는 게 뭔지 모른 채
 *  배포에서 처음 만나게 된다. */
export function realInput(e) {
  return e.isTrusted;
}

/* --- 셸과의 대화 -----------------------------------------------------------
 *  · hello  → 부팅 알림. 셸이 토큰과 노치 여백으로 답한다.
 *  · alive  → 하트비트. 끊기면 셸이 프레임을 다시 띄운다.
 *  · safeArea → env(safe-area-inset-*) 는 최상위 뷰포트 기준이라 프레임 안에서는
 *    0 이다. 셸이 잰 값을 --sa-* CSS 변수로 받아 style.css 가 그걸 쓴다. */
const SHELL_ORIGIN = location.origin;
let shellToken = null;

function applySafeArea(sa) {
  if (!sa) return;
  const root = document.documentElement.style;
  for (const side of ["top", "right", "bottom", "left"]) {
    if (typeof sa[side] === "string") root.setProperty("--sa-" + side, sa[side]);
  }
}

if (framed) {
  window.addEventListener("message", (e) => {
    if (e.origin !== SHELL_ORIGIN || e.source !== window.parent) return;
    const d = e.data;
    if (!d || d.ns !== "carparty") return;
    if (d.type === "boot") { shellToken = d.token; applySafeArea(d.safeArea); }
    else if (d.type === "safeArea") applySafeArea(d.safeArea);
  });

  const post = (type, extra) => {
    try { window.parent.postMessage({ ns: "carparty", type, ...extra }, SHELL_ORIGIN); } catch {}
  };
  post("hello");
  setInterval(() => { if (shellToken) post("alive", { token: shellToken }); }, 3000);
}
