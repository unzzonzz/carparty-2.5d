/* 랭크전 결과 (승패 + 점수 변화) */
export default function RankResultModal() {
  return (
    <div id="rankResultModal">
      <div className="dash-card">
        <h2 id="rankResultTitle">경쟁전 결과</h2>
        <div id="rankResultOutcome">-</div>
        <div className="dash-row"><span>점수 변화</span><span id="rankResultDelta">-</span></div>
        <div className="dash-row"><span>현재 점수</span><span id="rankResultScore">-</span></div>
        <button id="rankResultClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
