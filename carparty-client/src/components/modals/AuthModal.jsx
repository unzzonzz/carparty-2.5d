import LineIcon from "../LineIcon.jsx";

/* Caps Lock 경고 — 로그인/회원가입 폼이 같은 마크업을 쓴다 */
function CapsWarn() {
  return (
    <div className="caps-warn">
      <LineIcon width={2}>
        <line x1="5" y1="3" x2="19" y2="3" />
        <line x1="12" y1="21" x2="12" y2="8" />
        <polyline points="6 14 12 8 18 14" />
      </LineIcon>
      Caps Lock이 켜져 있어요
    </div>
  );
}

/* 로그인 / 회원가입 팝업 (전환은 엔진이 style.display 로 처리) */
export default function AuthModal() {
  return (
    <div id="authModal">
      <div className="auth-card">
        <div id="loginForm" className="auth-form">
          <h2>로그인</h2>
          <input id="loginId" type="text" maxLength={20} placeholder="아이디" autoComplete="off" />
          <input id="loginPw" type="password" maxLength={64} placeholder="비밀번호" autoComplete="off" />
          <CapsWarn />
          <button id="loginBtn" className="auth-btn">로그인</button>
          <div className="auth-switch">
            계정이 없나요? <span id="toSignup" className="auth-link">회원가입</span>
          </div>
        </div>

        <div id="signupForm" className="auth-form" style={{ display: "none" }}>
          <h2>회원가입</h2>
          <input id="signupId" type="text" maxLength={20} placeholder="아이디 (영문/숫자 3~20자)" autoComplete="off" />
          <input id="signupNick" type="text" maxLength={12} placeholder="닉네임" autoComplete="off" />
          <input id="signupPw" type="password" maxLength={64} placeholder="비밀번호 (8자 이상, 영문·숫자·특수기호)" autoComplete="off" />
          <CapsWarn />
          <button id="signupBtn" className="auth-btn">회원가입</button>
          <div className="auth-switch">
            이미 계정이 있나요? <span id="toLogin" className="auth-link">로그인</span>
          </div>
        </div>

        <button id="authClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
