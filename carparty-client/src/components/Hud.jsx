/* 화면 모서리 HUD : 나가기 · 속도계 · 음소거 토스트 · 메인화면 링크.
   표시/숨김은 전부 엔진이 style 로 제어한다. */
export default function Hud() {
  return (
    <>
      {/* 좌측 상단 나가기 버튼 (플레이 중에만 표시) */}
      <button id="exitBtn">나가기</button>

      {/* 좌측 하단 속도계 : 정수 km/h 숫자만 */}
      <div id="speed">0</div>

      {/* 가운데 하단 음소거 토스트 (m 키) : #time 과 동일 스타일, 잠깐 떴다 사라짐 */}
      <div id="muteToast" />

      {/* 메인(메뉴) 화면 우측 하단 텍스트 링크 : #time 과 동일 스타일 */}
      <a id="mainLink" href="https://discord.gg/G8n88REdCe" target="_blank" rel="noopener">
        디스코드 입장
      </a>
    </>
  );
}
