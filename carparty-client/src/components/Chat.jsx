/* 미니맵 하단 채팅창 (모든 모드 공유).
   #chatLog / #chatLogFriends / #chatTargetMenu 는 엔진이 채운다. */
export default function Chat() {
  return (
    <div id="chat">
      <div id="chatLog" />
      <div id="chatLogFriends" />
      <div id="chatRow">
        <div id="chatTabs">
          <button id="chatTabAll" className="chat-tab on">전체</button>
          <button id="chatTabFr" className="chat-tab">
            친구<span id="chatTabFrDot" className="fr-dot" />
          </button>
        </div>
        <button id="chatTarget">전체</button>
        <input
          id="chatInput"
          type="text"
          maxLength={200}
          placeholder="채팅을 입력하세요."
          autoComplete="off"
        />
        <button id="chatSend">전송</button>
      </div>
      {/* 친구 탭 귓속말 대상 선택 (전체 / 친구 개인) */}
      <div id="chatTargetMenu" />
    </div>
  );
}
