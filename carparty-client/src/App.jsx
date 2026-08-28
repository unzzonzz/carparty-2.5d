import useGameEngine from "./hooks/useGameEngine.js";

import GameCanvas from "./components/GameCanvas.jsx";
import Hud from "./components/Hud.jsx";
import LobbyOverlay from "./components/LobbyOverlay.jsx";
import Minimap from "./components/Minimap.jsx";
import Chat from "./components/Chat.jsx";
import Standings from "./components/Standings.jsx";
import RecordHud from "./components/RecordHud.jsx";
import ModeMenu from "./components/ModeMenu.jsx";
import TouchControls from "./components/TouchControls.jsx";
import Wipe from "./components/Wipe.jsx";

import AuthModal from "./components/modals/AuthModal.jsx";
import MapModal from "./components/modals/MapModal.jsx";
import DashboardPanels from "./components/modals/DashboardPanels.jsx";
import RankResultModal from "./components/modals/RankResultModal.jsx";
import PlayerModal from "./components/modals/PlayerModal.jsx";
import FriendsModal from "./components/modals/FriendsModal.jsx";
import TitlesModal from "./components/modals/TitlesModal.jsx";
import GiftModal from "./components/modals/GiftModal.jsx";
import RankModal from "./components/modals/RankModal.jsx";
import RoomBrowser from "./components/RoomBrowser.jsx";

/* =============================================================================
 *  App — UI 셸.
 * -----------------------------------------------------------------------------
 *  React 는 "화면의 뼈대"만 그린다. 그 안을 채우고 보이고 숨기는 일은 캔버스
 *  게임 엔진(src/game/)이 id 로 요소를 잡아 명령형으로 처리한다. 60Hz 로 도는
 *  물리/렌더 루프를 React 상태에 태우면 프레임마다 리렌더가 돌아 오히려 느리다.
 *
 *  그래서 이 트리에는 상태가 없다 — 최초 1회 마운트 후 React 는 DOM 을 다시
 *  건드리지 않고, 엔진이 넣은 자식(채팅 줄 · 순위 행 · 칭호 칩 …)도 안전하다.
 *  JSX 순서는 예전 index.html 의 DOM 순서 그대로다. 일부 요소는 z-index 가
 *  없어 쌓임 순서를 문서 순서에 의존하므로 함부로 옮기면 안 된다.
 * ========================================================================== */
export default function App() {
  useGameEngine();

  return (
    <>
      <GameCanvas />
      <Hud />
      <LobbyOverlay />
      <Minimap />
      <Chat />
      <Standings />
      <RecordHud />
      <ModeMenu />
      <AuthModal />
      <MapModal />
      <DashboardPanels />
      <RankResultModal />
      <PlayerModal />
      <FriendsModal />
      <TitlesModal />
      <GiftModal />
      <RankModal />
      <RoomBrowser />
      <TouchControls />
      <Wipe />
    </>
  );
}
