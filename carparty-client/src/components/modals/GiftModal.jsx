/* 이벤트 선물 수령 팝업 : 수령 전까지 로비마다 표시 */
export default function GiftModal() {
  return (
    <div id="giftModal">
      <div className="dash-card">
        <h2>선물 도착</h2>
        <div id="giftLine">운영자에게 선물이 도착했습니다!</div>
        <div id="giftMsg" />
        <button id="giftClaimBtn" className="auth-btn">수령</button>
      </div>
    </div>
  );
}
