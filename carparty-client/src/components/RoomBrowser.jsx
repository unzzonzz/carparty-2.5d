import LineIcon from "./LineIcon.jsx";

/* 프로 레이싱 커스텀 방 : 목록(브라우저) → 만들기 다이얼로그 → 대기실.
   원래 index.html 에서 셋이 붙어 있었고, 문서 순서를 그대로 유지한다. */

const COURSES = ["A-1", "A-2", "A-3", "B-1", "B-2", "B-3", "C-1", "C-2", "C-3"];

const TIME_LIMITS = [
  { value: "60000",  label: "1분"     },
  { value: "120000", label: "2분"     },
  { value: "180000", label: "3분"     },
  { value: "300000", label: "5분"     },
  { value: "0",      label: "제한 없음" },
];

export default function RoomBrowser() {
  return (
    <>
      {/* 프로 레이싱 방 목록 */}
      <div id="roomBrowser">
        <div className="browser-card">
          <div className="browser-head">
            <h2>커스텀 방</h2>
            <button id="createRoomBtn">+ 방 만들기</button>
          </div>
          <div id="roomList" />
        </div>
      </div>

      {/* 방 만들기 다이얼로그 */}
      <div id="createRoom">
        <div className="cr-card">
          <h2>방 만들기</h2>
          <label>방 이름</label>
          <input id="crName" type="text" maxLength={16} placeholder="방 이름 (비우면 자동)" autoComplete="off" />
          <div className="cr-row">
            <div className="cr-field">
              <label>바퀴 수</label>
              <input id="crLaps" type="number" min="1" max="20" defaultValue="3" />
            </div>
            <div className="cr-field">
              <label>최대 인원 (2~7명)</label>
              <input id="crMax" type="number" min="2" max="7" defaultValue="7" />
            </div>
          </div>
          <label>코스</label>
          <select id="crCourse" defaultValue="0">
            {COURSES.map((name, i) => (
              <option key={name} value={String(i)}>{name}</option>
            ))}
            <option value="random">랜덤</option>
          </select>
          <label>시간 제한</label>
          <select id="crTime" defaultValue="0">
            {TIME_LIMITS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="cr-buttons">
            <button id="crCreate">만들기</button>
            <button id="crCancel">취소</button>
          </div>
        </div>
      </div>

      {/* 프로 레이싱 로비(방) */}
      <div id="lobby">
        <div className="lobby-card">
          <h2 id="lobbyTitle">커스텀 대기실</h2>
          <p id="lobbyInfo" className="lobby-info" />
          <div id="lobbyList" />
          <p id="lobbyHint" className="lobby-hint" />
          <div className="lobby-buttons">
            <button id="readyBtn">준비</button>
            <button id="lobbyLeave">나가기</button>
            <button id="shareRoomBtn" aria-label="초대 링크 복사">
              <LineIcon className="icon-link">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </LineIcon>
              <LineIcon className="icon-check">
                <path d="M20 6 9 17l-5-5" />
              </LineIcon>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
