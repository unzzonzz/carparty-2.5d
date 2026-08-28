import { useEffect } from "react";

/* =============================================================================
 *  useGameEngine — React 가 UI 셸을 그린 뒤 캔버스 게임 엔진을 부팅한다.
 * -----------------------------------------------------------------------------
 *  엔진(src/game/engine.js)은 모듈 최상단에서 document.getElementById 로 캔버스와
 *  HUD 를 잡고 루프를 돈다. 예전 index.html 이 <body> 끝에서 <script> 로 불렀던
 *  것과 같은 전제라, 정적 import 로 올리면 React 마운트 전에 실행돼 전부 null 이
 *  된다. 그래서 effect 안에서 동적 import 로 "DOM 이 커밋된 뒤" 평가시킨다.
 *
 *  정리(cleanup)는 없다. 엔진에 teardown 이 없기 때문인데, 실제로 문제가 되지
 *  않는다 — ES 모듈은 한 번만 평가되므로 이 effect 가 여러 번 돌아도(개발 중
 *  StrictMode 이중 마운트 포함) 엔진은 한 번만 부팅된다.
 * ========================================================================== */
export default function useGameEngine() {
  useEffect(() => {
    let alive = true;
    import("../game/engine.js").catch((err) => {
      if (alive) console.error("[engine] 부팅 실패:", err);
    });
    return () => { alive = false; };
  }, []);
}
