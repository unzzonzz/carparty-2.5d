import LineIcon from "./LineIcon.jsx";

/* 기록 HUD (하단 가운데) : 시간 + 기록 시작(대기=타이머 / 기록 중=다시)
   + (기록 중) 취소 + 다른 차 표시. 그리고 프로 레이싱 상단 종료 카운트다운. */
export default function RecordHud() {
  return (
    <>
      <div id="recordHud">
        <span id="time" />
        <button id="attackBtn" aria-label="기록 시작">
          <LineIcon className="ic-timer" width={1.9}>
            <line x1="10" y1="2" x2="14" y2="2" />
            <line x1="12" y1="14" x2="12" y2="9" />
            <circle cx="12" cy="14" r="8" />
          </LineIcon>
          <LineIcon className="ic-restart" width={1.9}>
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </LineIcon>
        </button>
        <button id="attackCancel" aria-label="기록 취소">
          <LineIcon width={2.1}>
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </LineIcon>
        </button>
        <button id="othersToggle">다른 차 표시</button>
      </div>

      <div id="proTimer" />
    </>
  );
}
