/* 모바일 터치 조작 (터치 기기에서만 표시). data-key 는 엔진이 읽어 키 입력으로 바꾼다. */
export default function TouchControls() {
  return (
    <div id="touchControls">
      <div id="touchSteer">
        <button className="touch-btn" data-key="a">◀</button>
        <button className="touch-btn" data-key="d">▶</button>
      </div>
      <div id="touchDrive">
        <button className="touch-btn" data-key="s">후진</button>
        <button className="touch-btn" data-key="space">브레이크</button>
        <button className="touch-btn gas" data-key="w">전진</button>
      </div>
    </div>
  );
}
