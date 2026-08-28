/* 친구 패널 : 받은 신청 / 친구 목록 / 보낸 신청 / 닉네임 신청.
   각 목록은 엔진이 채운다. */
export default function FriendsModal() {
  return (
    <div id="friendsModal">
      <div className="dash-card friends-card">
        <h2>친구</h2>
        <div className="fr-sec" id="frIncomingSec">
          <div className="fr-sec-title">받은 신청</div>
          <div id="frIncoming" />
        </div>
        <div className="fr-sec">
          <div className="fr-sec-title">친구 목록</div>
          <div id="frList" />
        </div>
        <div className="fr-sec" id="frOutgoingSec">
          <div className="fr-sec-title">보낸 신청</div>
          <div id="frOutgoing" />
        </div>
        <div id="frAddRow">
          <input
            id="frAddInput"
            type="text"
            maxLength={12}
            placeholder="닉네임으로 친구 신청"
            autoComplete="off"
          />
          <button id="frAddBtn">신청</button>
        </div>
        <button id="frClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
