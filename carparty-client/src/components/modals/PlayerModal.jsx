/* 상대 플레이어 프로필 (차량 클릭) : 대시보드 + 친구 버튼 */
export default function PlayerModal() {
  return (
    <div id="playerModal">
      <div className="dash-card">
        <h2 id="piName">-</h2>
        <div className="dash-row"><span>활동</span><span id="piActivity">-</span></div>
        <div className="dash-row"><span>경쟁전 점수</span><span id="piRank">-</span></div>
        <div className="dash-row"><span>경쟁전 전적</span><span id="piRecord">-</span></div>
        <div className="dash-row"><span>보스전 최고 생존</span><span id="piBoss">-</span></div>
        <div className="dash-row"><span>접속 시간</span><span id="piTime">-</span></div>
        <button id="piFriendBtn" className="auth-btn">친구 추가</button>
        <button id="piClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
