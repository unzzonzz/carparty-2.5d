/* =============================================================================
 *  Cloudflare Pages Function — /ws 를 게임 서버로 프록시한다.
 * -----------------------------------------------------------------------------
 *  파일 경로가 곧 라우트다 : functions/ws.js → /ws
 *
 *    브라우저 ── wss://carparty-io.pages.dev/ws
 *                       │  (이 함수)
 *                       └─→ wss://api.wkrdjqtlf.work/carparty-io
 *
 *  왜 _redirects 가 아니라 Function 인가
 *    _redirects 는 정적 자산의 HTTP 리다이렉트/리라이트만 다룬다. WebSocket
 *    업그레이드(101)는 처리하지 못하므로 Worker 코드가 필요하다.
 *
 *  비용/지연
 *    핸드셰이크만 이 함수를 거치고, 101 응답을 그대로 반환하면 이후 프레임은
 *    Cloudflare 가 직접 파이프한다 — 메시지마다 함수가 깨어나지 않는다.
 *    Pages 와 백엔드 도메인이 둘 다 Cloudflare 뒤에 있어 홉 추가 비용도 작다.
 *    60Hz 넷코드라 이 전제가 깨지면(예: 프레임마다 가공) 곧장 체감되니 주의.
 *
 *  업스트림 주소는 환경변수 GAME_SERVER_URL 로 덮어쓸 수 있다. 스킴은 https —
 *  Workers 의 fetch 는 Upgrade 헤더를 보고 알아서 WebSocket 으로 승격시킨다.
 * ========================================================================== */

const DEFAULT_UPSTREAM = "https://api.wkrdjqtlf.work/carparty-io";

export const onRequest = async ({ request, env }) => {
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return new Response("이 경로는 WebSocket 전용입니다.", {
      status: 426,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const upstream = new URL(env.GAME_SERVER_URL || DEFAULT_UPSTREAM);
  upstream.search = new URL(request.url).search; // 쿼리는 그대로 넘긴다

  // 101 응답에는 webSocket 이 실려 온다. 손대지 말고 그대로 반환해야 한다.
  return fetch(new Request(upstream, request));
};
