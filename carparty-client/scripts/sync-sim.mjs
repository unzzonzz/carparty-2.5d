/* =============================================================================
 *  sync-sim.mjs — 서버 repo 의 시뮬 코어를 이 repo 로 복제한다.
 * -----------------------------------------------------------------------------
 *  넷코드 v4 는 "클라와 서버가 완전히 같은 코드로 물리를 적분한다"가 전제다
 *  (NETCODE.md §5). 두 프로젝트가 별도 repo 로 갈라진 뒤에도 이 조건을 지키려면
 *  한쪽이 정본이어야 하고, 정본은 판정 권위가 있는 **서버**다.
 *
 *  이 스크립트는 carparty-server/sim.js 를 읽어 src/game/sim.js 로 쓴다.
 *  차이는 마지막 한 줄(ESM export)뿐이고 그것도 여기서 기계적으로 붙인다 —
 *  손으로 고친 흔적이 있으면 시뮬이 갈라지므로 생성물임을 파일에 명시한다.
 *
 *  서버 repo 가 옆에 없으면(클라만 클론한 경우) 커밋된 사본을 그대로 두고
 *  경고만 남긴다. 그래서 이 repo 는 혼자서도 빌드된다.
 *
 *  실행 : npm run sync:sim   (predev / prebuild 에서 자동 실행)
 *  경로 바꾸기 : SIM_SOURCE=/path/to/sim.js npm run sync:sim
 * ========================================================================== */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

// 기본값 : 형제 폴더로 나란히 클론한 서버 repo.
// repo 이름은 carparty-server 지만 폴더명을 바꿔 클론하는 일이 흔해 몇 가지를 훑는다.
const CANDIDATES = ["carparty-server", "carparty_server", "server"];
const SOURCE = process.env.SIM_SOURCE
  ? resolve(process.env.SIM_SOURCE)
  : CANDIDATES.map((n) => resolve(ROOT, "..", n, "sim.js")).find(existsSync)
    ?? resolve(ROOT, "..", CANDIDATES[0], "sim.js"); // 못 찾으면 아래 안내에 쓰인다

const TARGET = resolve(ROOT, "src", "game", "sim.js");

const BANNER =
  "/* 자동 생성 파일 — 직접 수정하지 마세요.\n" +
  " * 정본은 carparty-server/sim.js 이고, `npm run sync:sim` 이 여기로 복제합니다.\n" +
  " * 이 파일을 손으로 고치면 클라와 서버의 물리가 갈라져 넷코드가 깨집니다. */\n";

// sim.js 는 CommonJS 다. 끝의 module.exports 줄은 `typeof module` 가드가 있어
// ESM 에서도 안전하게 건너뛰어진다. Vite 가 읽을 수 있게 ESM export 만 덧붙인다.
const FOOTER = "\n// (sync-sim.mjs 가 추가) Vite/브라우저용 ESM 내보내기\nexport default SIM;\n";

if (!existsSync(SOURCE)) {
  const kept = existsSync(TARGET);
  console.warn(
    `[sync-sim] 서버 repo 를 못 찾았습니다: ${SOURCE}\n` +
    `[sync-sim] ${kept
      ? "커밋된 기존 사본을 그대로 씁니다. 서버 쪽 물리를 고쳤다면 두 repo 를 형제 폴더로 두고 다시 실행하세요."
      : "사본도 없어 빌드가 실패합니다. SIM_SOURCE 로 경로를 지정하세요."}`
  );
  process.exit(kept ? 0 : 1);
}

const source = readFileSync(SOURCE, "utf8");
const next = BANNER + source + FOOTER;
const prev = existsSync(TARGET) ? readFileSync(TARGET, "utf8") : null;

if (prev === next) {
  console.log("[sync-sim] 이미 최신입니다 (src/game/sim.js).");
} else {
  writeFileSync(TARGET, next);
  console.log(`[sync-sim] ${prev === null ? "생성" : "갱신"}: src/game/sim.js  ← ${SOURCE}`);
}
