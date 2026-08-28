/* 채팅 아래 순위판 — 프로 레이싱 순위와 자유 모드 TOP10 기록.
   목록 내용은 엔진이 채운다. */
export default function Standings() {
  return (
    <>
      <div id="standings">
        <div className="stand-title">순위</div>
        <div id="standingsList" />
      </div>

      <div id="topRecords">
        <div className="stand-title">TOP 10</div>
        <div id="topRecordsList" />
      </div>
    </>
  );
}
