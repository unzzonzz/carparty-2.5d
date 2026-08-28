import LineIcon from "../LineIcon.jsx";

/* 게이트 그룹 팝업 : 카드(16:9)로 맵 선택. 제목/설명/카드는 엔진이 채운다. */
export default function MapModal() {
  return (
    <div id="mapModal">
      <div className="map-panel">
        <button id="mapModalBack" aria-label="뒤로">
          <LineIcon width={2}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </LineIcon>
        </button>
        <h2 id="mapModalTitle" />
        <p id="mapModalDesc" />
        <div id="mapGrid" />
        <button id="mapModalClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
