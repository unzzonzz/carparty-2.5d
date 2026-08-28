/* CarParty.io 서비스워커 — PWA 설치 자격 + 오프라인 폴백.
 *  전략: "네트워크 우선" (항상 최신 코드; 잦은 배포에도 stale 안 됨) → 실패 시 캐시 폴백.
 *  WebSocket 은 fetch 이벤트를 안 거치므로 실시간 통신엔 영향 없음. */
/*  주의: JS/CSS 는 더 이상 고정 경로가 아니다. Vite 가 해시 붙은 /assets/*.js|css
 *  로 내보내므로 셸 목록에 넣을 수 없고, 아래 "네트워크 우선" 런타임 캐시가
 *  첫 방문 때 알아서 담는다. (addAll 은 하나라도 404 면 전체가 실패한다) */
/*  문서가 둘이다 : "/" 는 셸(iframe 하나만 든 최상위), 게임 본체는 그 안에서
 *  도는 play 문서다. 오프라인 첫 방문에도 게임이 뜨려면 둘 다 담아야 한다.
 *  경로가 둘인 이유 : Cloudflare Pages 는 .html 을 떼고 /play 로 서빙하고(원본
 *  /play.html 은 308), 서버가 dist 를 직접 서빙하면 /play.html 그대로다. */
const CACHE = "carparty-v3";
const SHELL = [
  "/", "/index.html", "/play", "/play.html",
  "/manifest.webmanifest", "/car-icon.svg",
  "/icon-192.png", "/icon-512.png", "/icon-512-maskable.png",
];

self.addEventListener("install", (e) => {
  // addAll 이 아니라 하나씩 담는다. addAll 은 목록 중 하나만 404 여도(또는 위
  // /play·/play.html 처럼 한쪽이 리다이렉트여도) 통째로 실패해 캐시가 텅 빈다.
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                 // WS 업그레이드/POST 등은 그대로 통과
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;        // 외부 리소스는 그대로
  // 네트워크 우선 → 최신 유지, 성공 시 캐시 갱신, 실패(오프라인) 시 캐시 폴백
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match(fallbackFor(url))))
  );
});

/*  오프라인 폴백 문서 고르기.
 *  게임 문서 요청에 셸(/index.html)을 돌려주면 프레임 안에 또 셸이 들어가
 *  iframe 이 무한히 중첩된다. 문서별로 자기 것을 돌려준다. */
function fallbackFor(url) {
  return /\/play(\.html)?$/.test(url.pathname) ? url.pathname : "/index.html";
}
