import LineIcon from "./LineIcon.jsx";

/* 로비 오버레이 : 접속 직후 대기 화면 (움직이면 걷히고, 정지하면 버튼만 복귀) */
export default function LobbyOverlay() {
  return (
    <div id="lobbyUI">
      <span id="lobBrand" className="lob-el">CarParty.io</span>
      <span id="lobOnline" className="lob-el">온라인 0</span>

      <div id="lobHint" className="lob-el">
        {/* data-drive : 엔진이 조작키 설정(WASD/방향키)에 맞춰 글자를 바꾼다 */}
        <div className="kb">
          <kbd className="keycap keycap-w" data-drive="w">W</kbd>
          <kbd className="keycap" data-drive="a">A</kbd>
          <kbd className="keycap" data-drive="s">S</kbd>
          <kbd className="keycap" data-drive="d">D</kbd>
          <kbd className="keycap keycap-space"><span className="spc" /></kbd>
        </div>
      </div>

      <div id="lobBtns" className="lob-el">
        <button id="lobAccount" className="lob-btn" aria-label="계정">
          <LineIcon>
            <circle cx="12" cy="7" r="4" />
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          </LineIcon>
        </button>

        <button id="lobDash" className="lob-btn" aria-label="대시보드">
          <LineIcon>
            <path d="M5 20v-8" />
            <path d="M12 20V5" />
            <path d="M19 20v-11" />
          </LineIcon>
        </button>

        <button id="lobFriends" className="lob-btn" aria-label="친구">
          <LineIcon>
            <circle cx="9" cy="7" r="4" />
            <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
            <path d="M16 3.1a4 4 0 0 1 0 7.8" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.85" />
          </LineIcon>
          <span id="lobFriendsDot" className="fr-dot" />
        </button>

        <button id="lobTitles" className="lob-btn" aria-label="칭호">
          <LineIcon>
            <circle cx="12" cy="8" r="6" />
            <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
            <path d="M12 5.6l.85 1.55 1.75.3-1.25 1.25.3 1.75L12 9.6l-1.65.85.3-1.75L9.4 7.45l1.75-.3z" />
          </LineIcon>
        </button>

        <button id="lobRank" className="lob-btn" aria-label="랭킹">
          <LineIcon>
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
            <path d="M7 6H5a2 2 0 0 0 0 4h1" />
            <path d="M17 6h2a2 2 0 0 1 0 4h-1" />
          </LineIcon>
        </button>

        <a
          id="lobDiscord"
          className="lob-btn"
          href="https://discord.gg/G8n88REdCe"
          target="_blank"
          rel="noopener"
          aria-label="디스코드"
        >
          <LineIcon>
            <path d="M9 5.2a13 13 0 0 1 6 0" />
            <path d="M6.3 5.6C4.6 6.2 3.4 7.2 3 8.4c-.9 2.9-1.1 5.8-.6 8.6 1.4 1.1 2.9 1.8 4.5 2.2l.9-1.8" />
            <path d="M17.7 5.6c1.7.6 2.9 1.6 3.3 2.8.9 2.9 1.1 5.8.6 8.6-1.4 1.1-2.9 1.8-4.5 2.2l-.9-1.8" />
            <path d="M8.6 17.7c2.2.5 4.6.5 6.8 0" />
            <circle cx="9.3" cy="12" r="0.8" fill="currentColor" />
            <circle cx="14.7" cy="12" r="0.8" fill="currentColor" />
          </LineIcon>
          <span className="lob-tip">디스코드 들어와주세요!</span>
        </a>

        <button id="lobSettings" className="lob-btn" aria-label="설정">
          <LineIcon>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </LineIcon>
        </button>
      </div>
    </div>
  );
}
