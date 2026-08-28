/* 이 문서(play.html)는 셸의 iframe 안에서 돈다. guard 는 제일 먼저 평가돼야
 * 한다 — 엔진이 쓸 네이티브(WebSocket·시계)를 아무도 건드리기 전에 붙잡아
 * 두고, 최상위로 직접 열린 경우 셸로 되돌린다. 부수효과가 목적인 import 라
 * 다른 import 보다 위에 둔다. */
import "./security/guard.js";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./styles/style.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// 서비스워커 등록은 셸(src/shell.js)로 옮겼다 — 최상위 문서가 등록해야
// PWA 설치 자격과 오프라인 폴백이 셸까지 덮는다.
