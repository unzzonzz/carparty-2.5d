/* 칭호 패널 : 장착 중 + 보유/미획득 칩 (미획득은 비활성 + 호버 툴팁).
   #ttGrid 는 엔진이 채운다. */

const RARITIES = [
  { label: "일반", color: "#b9b3a6" },
  { label: "희귀", color: "#3d9be9" },
  { label: "영웅", color: "#e8604c" },
  { label: "전설", color: "#d9a013" },
];

export default function TitlesModal() {
  return (
    <div id="titlesModal">
      <div className="dash-card titles-card">
        <h2>칭호 <span id="ttCnt" className="tt-cnt" /></h2>
        <div id="ttEquipRow">
          <span className="tt-lab">장착 중</span>
          <span id="ttEquipName" className="none">없음</span>
          <button id="ttUnequip">해제</button>
        </div>
        <div id="ttGrid" />
        <div id="ttLegend">
          {RARITIES.map((r) => (
            <span key={r.label} style={{ "--c": r.color }}>{r.label}</span>
          ))}
        </div>
        <button id="ttClose" className="auth-btn auth-close">닫기</button>
      </div>
    </div>
  );
}
