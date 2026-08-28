"use strict";

/* =============================================================================
 *  paths.js — 서버가 읽고 쓰는 경로를 한 곳에 모은다.
 * -----------------------------------------------------------------------------
 *  데이터 파일(users.json 등)은 기본적으로 이 repo 루트에 쓴다.
 *  운영 서버에서 데이터를 코드와 분리해 두고 싶으면 DATA_DIR 로 지정한다.
 *    예) DATA_DIR=/var/lib/carparty npm start
 *
 *  클라이언트는 별도 repo(carparty-client)다. 한 호스트에서 같이 서빙하려면
 *  그쪽에서 `npm run build` 한 dist 를 여기서 정적 서빙한다. 기본값은 형제
 *  폴더로 클론했을 때의 경로이고, 다르면 CLIENT_DIST 로 지정한다.
 *    예) CLIENT_DIST=/srv/carparty/dist npm start
 *  클라이언트를 정적 호스팅에 따로 올렸다면 dist 는 없어도 되고,
 *  이 서버는 WebSocket 만 담당한다.
 * ========================================================================== */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : ROOT;

// repo 이름은 carparty-client 지만 폴더명을 바꿔 클론하는 일이 흔해 몇 가지를 훑는다.
const CLIENT_DIRS = ["carparty-client", "carparty_client", "client"];
const findClientDist = () =>
  CLIENT_DIRS.map((name) => path.resolve(ROOT, "..", name, "dist"))
    .find((p) => fs.existsSync(path.join(p, "index.html")))
  ?? path.resolve(ROOT, "..", CLIENT_DIRS[0], "dist"); // 못 찾으면 안내 메시지에 쓰인다

const CLIENT_DIST = process.env.CLIENT_DIST
  ? path.resolve(process.env.CLIENT_DIST)
  : findClientDist();

module.exports = {
  ROOT,
  DATA_DIR,
  CLIENT_DIST,
  USERS_FILE: path.join(DATA_DIR, "users.json"),
  RECORDS_FILE: path.join(DATA_DIR, "records.json"),
  CHAT_LOG_FILE: path.join(DATA_DIR, "chat-log.jsonl"),
  // 타임어택 기록 중 입력 계측이 "사람 같지 않다" 고 본 건들 (append-only).
  //  판단 근거 수치가 같이 들어 있어, 임계값을 실제 데이터로 조정할 수 있다.
  TA_SUSPECT_FILE: path.join(DATA_DIR, "ta-suspect.jsonl"),
};
