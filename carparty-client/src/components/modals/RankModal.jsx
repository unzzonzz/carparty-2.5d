import LineIcon from "../LineIcon.jsx";

/* 로비 랭킹 : 모든 코스 순위 (페이지네이션).
   코스 탭/목록/페이지 표시는 엔진이 채운다. */
export default function RankModal() {
  return (
    <div id="rankModal">
      <div className="rank-card">
        <h2>랭킹</h2>
        <div id="rankCourses" />
        <div id="rankList" />
        <div id="rankPager">
          <button id="rankPrev" className="rank-page-btn" aria-label="이전">
            <LineIcon width={2}><polyline points="15 18 9 12 15 6" /></LineIcon>
          </button>
          <span id="rankPageInfo">1 / 1</span>
          <button id="rankNext" className="rank-page-btn" aria-label="다음">
            <LineIcon width={2}><polyline points="9 18 15 12 9 6" /></LineIcon>
          </button>
        </div>
        <button id="rankClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
