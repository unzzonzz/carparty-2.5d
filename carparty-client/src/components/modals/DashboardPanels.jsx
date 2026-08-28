/* 대시보드 버튼 + 계정 / 설정 / 대시보드 팝업.
   원래 index.html 에서 이 넷은 붙어 있었고, 문서 순서를 그대로 유지한다. */

/* 4모서리 배치 선택 (미니맵 · 채팅) */
function CornerSeg({ id }) {
  return (
    <div className="set-seg" id={id}>
      <button data-pos="tl">좌상</button>
      <button data-pos="tr">우상</button>
      <button data-pos="bl">좌하</button>
      <button data-pos="br">우하</button>
    </div>
  );
}

/* 끄기/켜기 토글 */
function OnOffSeg({ id }) {
  return (
    <div className="set-seg" id={id}>
      <button data-val="off">끄기</button>
      <button data-val="on">켜기</button>
    </div>
  );
}

export default function DashboardPanels() {
  return (
    <>
      {/* 좌측 하단 대시보드 버튼 (로그인 시) */}
      <button id="dashBtn">대시보드</button>

      {/* 계정 정보 팝업 (로그인 시 계정 아이콘) */}
      <div id="accountModal">
        <div className="dash-card">
          <h2>계정</h2>
          <div className="dash-row"><span>아이디</span><span id="accId">-</span></div>
          <div className="dash-row"><span>닉네임</span><span id="accName">-</span></div>
          <button id="accLogoutBtn" className="auth-btn acc-logout">로그아웃</button>
          <button id="accClose" className="auth-btn auth-close">닫기</button>
        </div>
      </div>

      {/* 설정 팝업 (사운드 볼륨 + 미니맵/채팅 모서리 배치) */}
      <div id="settingsModal">
        <div className="dash-card">
          <h2>설정</h2>
          <div className="set-row">
            <span className="set-label">사운드</span>
            <input id="setVolume" type="range" min="0" max="100" step="1" defaultValue="100" />
            <span id="setVolumeVal">100</span>
          </div>
          <div className="set-row">
            <span className="set-label">시야각</span>
            <input id="setFov" type="range" min="40" max="100" step="5" defaultValue="50" />
            <span id="setFovVal">50</span>
          </div>
          <div className="set-row">
            <span className="set-label">조작키</span>
            <div className="set-seg" id="setKeys">
              <button data-val="wasd">WASD</button>
              <button data-val="arrows">방향키</button>
            </div>
          </div>
          <div className="set-row">
            <span className="set-label">미니맵 위치</span>
            <CornerSeg id="setMmPos" />
          </div>
          <div className="set-row">
            <span className="set-label">채팅 위치</span>
            <CornerSeg id="setChatPos" />
          </div>
          <div className="set-row">
            <span className="set-label">속력 표시</span>
            <OnOffSeg id="setSpeed" />
          </div>
          <div className="set-row">
            <span className="set-label">내 이름표</span>
            <OnOffSeg id="setMyName" />
          </div>
          <div className="set-row">
            <span className="set-label">친구 접속 알림</span>
            <OnOffSeg id="setFrNotice" />
          </div>
          <button id="setClose" className="auth-btn auth-close">닫기</button>
        </div>
      </div>

      {/* 대시보드 패널 */}
      <div id="dashboard">
        <div className="dash-card">
          <h2>대시보드</h2>
          <div className="dash-row"><span>접속 시간</span><span id="dashTime">-</span></div>
          <div className="dash-row" id="dashRankScoreRow"><span>경쟁전 점수</span><span id="dashRankScore">-</span></div>
          <div className="dash-row" id="dashRankRecordRow"><span>경쟁전 전적</span><span id="dashRankRecord">-</span></div>
          <div className="dash-row" id="dashCasualRecordRow"><span>일반전 전적</span><span id="dashCasualRecord">-</span></div>
          <div className="dash-row"><span>연속 접속</span><span id="dashStreak">-</span></div>
          <div className="dash-row"><span>보유 칭호</span><span id="dashTitles">-</span></div>
          <button id="dashClose" className="auth-btn auth-close">닫기</button>
        </div>
      </div>
    </>
  );
}
