/* 사망 화면 + 시작/모드 선택 화면 (새로고침·사망·나가기 시 표시).
   모드 버튼의 인원수(#countXxx)는 엔진이 서버 스냅샷으로 갱신한다. */

const MODES = [
  { id: "btnRacing", cls: "racing", name: "자유 레이싱",   count: "countRacing" },
  { id: "btnHard",   cls: "hard",   name: "하드코어 레이싱", count: "countHard"   },
  { id: "btnSerp",   cls: "serp",   name: "구불구불 레이싱", count: "countSerp"   },
  { id: "btnPro",    cls: "pro",    name: "프로 레이싱",    count: "countPro"    },
];

export default function ModeMenu() {
  return (
    <>
      {/* 사망 화면 (받혀서 죽은 플레이어에게 표시) */}
      <div id="death">
        <div className="death-title">사망...</div>
        <div className="death-sub">모드 선택으로…</div>
      </div>

      <div id="menu">
        <div className="menu-card">
          <h1>CarParty.io</h1>
          <label id="nameLabel" htmlFor="nameInput">닉네임</label>
          <input
            id="nameInput"
            type="text"
            maxLength={12}
            placeholder="이름을 입력하세요"
            autoComplete="off"
          />

          <div className="mode-buttons">
            {MODES.map((m) => (
              <button key={m.id} id={m.id} className={`mode-btn ${m.cls}`}>
                <span className="mode-name">{m.name}</span>
                <span className="mode-count" id={m.count}>0명</span>
              </button>
            ))}
          </div>

          {/* 로그인 / 회원가입 (버튼 → 팝업) */}
          <div id="authBox">
            <button id="authOpenBtn" className="auth-btn">로그인 / 회원가입</button>
            <div id="loggedIn" className="auth-form" style={{ display: "none" }}>
              <span id="welcomeMsg" />
              <button id="logoutBtn" className="auth-btn">로그아웃</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
