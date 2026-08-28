/* 게임 메인 캔버스 (월드 렌더링). 문서 첫 요소여야 나머지 UI 밑에 깔린다 —
   z-index 가 없어 쌓임 순서를 문서 순서에 의존한다. */
export default function GameCanvas() {
  return <canvas id="game" />;
}
