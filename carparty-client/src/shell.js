/* =============================================================================
 *  shell.js — 최상위 문서(index.html)가 하는 유일한 일.
 * -----------------------------------------------------------------------------
 *  게임 문서(play.html)를 iframe 안에 띄우고, 그 바깥에서 필요한 것만 챙긴다.
 *
 *  왜 프레임으로 나눴나
 *   개발자도구 콘솔은 기본적으로 "최상위 문서" 컨텍스트에서 평가된다. 게임이
 *   별도 문서 안에 있으면 콘솔에서 합성 키 이벤트를 쏘거나(window.dispatchEvent)
 *   게임 DOM 을 건드리려면 컨텍스트를 프레임으로 바꾸는 한 단계를 더 거쳐야 한다.
 *   또 앞으로 셸에 붙일지 모르는 외부 스크립트(애널리틱스 등)가 게임 문서와
 *   같은 전역을 공유하지 않게 된다.
 *
 *   프레임은 "벽"이 아니라 "문턱"이다. 진짜 방어는 서버 권위 시뮬(입력만 전송)과
 *   src/security/guard.js 의 런타임 검사, 그리고 서버측 기록 검증이 한다.
 *
 *  프레임 안팎으로 넘겨야 하는 것들
 *   · ?room=  초대 링크 쿼리 — 프레임 src 로 전달하고 최상위 주소에선 지운다.
 *   · safe-area  노치 여백. env(safe-area-inset-*) 는 최상위 뷰포트 기준이라
 *     프레임 안에서는 전부 0 이 된다. 셸이 재서 CSS 변수로 밀어 넣는다.
 *   · 포커스  키보드 이벤트는 포커스된 문서에만 간다. 프레임을 계속 잡아둔다.
 * ========================================================================== */

const FRAME_SRC = "/play.html";
const frame = document.getElementById("stage");

/* 셸 ↔ 프레임 공유 토큰. 프레임이 하트비트에 실어 되돌려주므로, 우리가 띄운
 * 문서가 아직 살아 있는지(다른 페이지로 갈아치워지지 않았는지) 알 수 있다. */
const bootToken = (() => {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
})();

/* --- 프레임 띄우기 ---------------------------------------------------------
 *  초대 링크(?room=ID)는 프레임으로 넘기고 최상위 주소에서는 지운다.
 *  (지우지 않으면 새로고침 때마다 같은 방으로 다시 들어간다 — 프레임 안 엔진도
 *   같은 이유로 자기 주소에서 지운다.) */
{
  const q = new URLSearchParams(location.search);
  const room = q.get("room");
  const pass = new URLSearchParams();
  if (room) pass.set("room", room);
  frame.src = pass.toString() ? `${FRAME_SRC}?${pass}` : FRAME_SRC;
  if (location.search) history.replaceState(null, "", location.pathname);
}

/* --- 노치 여백 재기 --------------------------------------------------------
 *  env() 는 CSS 안에서만 읽히므로, 값만 뽑아내는 프로브를 하나 두고 계산값을 읽는다. */
const probe = document.createElement("div");
probe.style.cssText =
  "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
  "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) " +
  "env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
document.body.appendChild(probe);

function safeArea() {
  const s = getComputedStyle(probe);
  return { top: s.paddingTop, right: s.paddingRight, bottom: s.paddingBottom, left: s.paddingLeft };
}

/* --- 프레임과의 대화 -------------------------------------------------------
 *  같은 오리진이지만 postMessage 로만 주고받는다. contentWindow 를 직접 뒤지지
 *  않으니 나중에 프레임을 다른 오리진(진짜 샌드박스)으로 옮겨도 그대로 돈다. */
function post(type, extra) {
  const w = frame.contentWindow;
  if (!w) return;
  try { w.postMessage({ ns: "carparty", type, ...extra }, location.origin); } catch {}
}

let alive = Date.now(); // 프레임이 마지막으로 살아 있다고 알린 시각

window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
  const d = e.data;
  if (!d || d.ns !== "carparty") return;

  if (d.type === "hello") {
    // 프레임 부팅 완료 — 토큰과 노치 여백을 건네고 포커스를 준다.
    alive = Date.now();
    post("boot", { token: bootToken, safeArea: safeArea() });
    focusFrame();
  } else if (d.type === "alive" && d.token === bootToken) {
    alive = Date.now();
    revives = 0; // 정상 하트비트가 돌아왔다 = 되살리기 예산 회복
  }
});

/* --- 포커스 유지 -----------------------------------------------------------
 *  키 이벤트는 포커스된 문서에만 간다. 최초 로드/탭 복귀/셸 클릭 때 프레임에 넘긴다. */
function focusFrame() {
  try { frame.contentWindow.focus(); } catch {}
}
frame.addEventListener("load", focusFrame);
window.addEventListener("focus", focusFrame);
document.addEventListener("visibilitychange", () => { if (!document.hidden) focusFrame(); });

/* --- 노치 여백 갱신 --------------------------------------------------------
 *  회전/주소창 접힘으로 값이 바뀐다. 프레임 크기 변화는 셸 resize 로 같이 온다. */
let saTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(saTimer);
  saTimer = setTimeout(() => post("safeArea", { safeArea: safeArea() }), 120);
});

/* --- 프레임 감시 -----------------------------------------------------------
 *  두 가지를 본다. 둘 다 "고장 복구"지 탐지가 아니다 — 되돌려 놓기만 한다.
 *   1) 프레임 엘리먼트가 지워지거나 src 가 딴 데로 바뀜 (DOM 변조)
 *   2) 하트비트 침묵 — 안에서 돌던 문서가 사라짐. 백그라운드 탭은 타이머가
 *      스로틀돼 조용해지므로 화면이 보일 때만 센다.
 *
 *  되살리기는 몇 번만 한다. 배포가 깨져 프레임이 아예 못 뜨는 상황에서 무한히
 *  다시 띄우면 빈 화면이 새로고침 루프가 되고 서버만 두들긴다. 몇 번 해 보고
 *  안 되면 손을 뗀다 — 고장은 고장대로 보이는 편이 낫다. */
const MAX_REVIVES = 3;
let revives = 0;

function reviveFrame() {
  if (revives >= MAX_REVIVES) return;
  revives++;
  alive = Date.now();
  frame.src = FRAME_SRC; // 재부팅되면 hello 가 다시 온다
}

new MutationObserver(() => {
  if (!frame.isConnected) { document.body.appendChild(frame); return; }
  if (!(frame.getAttribute("src") || "").startsWith(FRAME_SRC)) reviveFrame();
}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });

setInterval(() => {
  if (document.hidden) { alive = Date.now(); return; } // 스로틀 구간은 세지 않는다
  if (Date.now() - alive < 15000) return;
  reviveFrame();
}, 5000);

/* --- 서비스워커 (PWA 설치 자격 + 오프라인 폴백) ----------------------------
 *  최상위 문서에서 등록해야 셸이 컨트롤 대상이 된다. 개발 중에는 등록하지
 *  않는다 — Vite 개발 자원까지 캐시하면 HMR 이 stale 해진다. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
