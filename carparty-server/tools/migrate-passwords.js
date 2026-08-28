// 저장된 평문 비밀번호를 한 번에 해시(pwv:2)로 바꾼다.
//  서버는 로그인 성공 시에도 자동으로 이관하지만, 한동안 접속하지 않는 계정은
//  평문이 저장소에 계속 남는다. 이 스크립트로 그걸 지금 다 없앤다.
//
//  실행:  node tools/migrate-passwords.js          (무엇이 바뀔지 미리보기만)
//         node tools/migrate-passwords.js --apply  (실제 저장)
//
//  저장 위치는 서버와 같은 규칙 : UPSTASH_* 환경변수가 있으면 Redis, 없으면 users.json.
//  로컬 파일을 대상으로 하려면 서버와 같은 DATA_DIR 을 주고 실행해야 한다.
"use strict";
require("dotenv").config();
const fs = require("fs");
const crypto = require("crypto");
const PATHS = require("../paths.js");

const APPLY = process.argv.includes("--apply");

// server.js 와 동일해야 하는 값/함수 (바꾸면 양쪽 다 바꿀 것)
const PW_PEPPER = "carparty:v1:";
const clientHash = (id, pw) =>
  crypto.createHash("sha256").update(PW_PEPPER + String(id).toLowerCase() + ":" + String(pw)).digest("hex");
const scryptHash = (secret, salt) => crypto.scryptSync(String(secret), salt, 32).toString("hex");

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const USER_SET = "cargame:userids";
const userKey = (id) => "cargame:user:" + id;
const redis = useRedis
  ? new (require("@upstash/redis").Redis)({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

async function loadUsers() {
  if (!useRedis) return JSON.parse(fs.readFileSync(PATHS.USERS_FILE, "utf8"));
  const out = {};
  for (const id of (await redis.smembers(USER_SET)) || []) {
    const u = await redis.get(userKey(id));
    if (u) out[id] = u;
  }
  return out;
}

(async () => {
  let users;
  try { users = await loadUsers(); }
  catch (e) { console.error("계정을 못 읽었어요:", e.message); process.exit(1); }

  const plain = [];   // 평문 저장 → 이관 가능
  const legacy = [];  // scrypt(원문) 옛 형식 → 원문을 모르므로 이관 불가
  const done = [];    // 이미 최신 형식
  for (const id in users) {
    const u = users[id];
    if (u.password != null) plain.push(id);
    else if (u.pwv === 2 && u.salt && u.hash) done.push(id);
    else if (u.salt && u.hash) legacy.push(id);
  }

  console.log(`저장소: ${useRedis ? "Upstash Redis" : PATHS.USERS_FILE}`);
  console.log(`계정 ${Object.keys(users).length}개 — 이미 해시 ${done.length} / 평문 ${plain.length} / 옛 해시 ${legacy.length}`);
  if (legacy.length) {
    // 이 계정들은 원문을 복원할 수 없어 pwh 로 옮길 수 없다. 원문을 보내는 구버전
    // 클라이언트에서만 로그인되므로, 새 클라이언트 배포 후에는 로그인이 막힌다.
    console.log(`\n⚠ 옛 해시(scrypt(원문)) 계정은 이관할 수 없어요 — 새 클라이언트로는 로그인 불가:`);
    console.log(`  ${legacy.join(", ")}`);
    console.log(`  → 해당 사용자에게 재가입을 안내하거나 비밀번호를 재설정해 주세요.`);
  }
  if (!plain.length) { console.log("\n평문으로 남은 계정이 없어요. 할 일 없음."); process.exit(0); }

  console.log(`\n평문 → 해시로 바꿀 계정 ${plain.length}개: ${plain.join(", ")}`);
  if (!APPLY) { console.log("\n미리보기입니다. 실제로 바꾸려면 --apply 를 붙여 실행하세요."); process.exit(0); }

  for (const id of plain) {
    const u = users[id];
    const salt = crypto.randomBytes(16).toString("hex");
    u.pwv = 2;
    u.salt = salt;
    u.hash = scryptHash(clientHash(id, u.password), salt); // 클라가 보냈을 pwh 를 서버가 대신 계산해서 해싱
    delete u.password;
    if (useRedis) { await redis.set(userKey(id), u); await redis.sadd(USER_SET, id); }
  }
  if (!useRedis) fs.writeFileSync(PATHS.USERS_FILE, JSON.stringify(users));
  console.log(`\n완료 — ${plain.length}개 계정을 해시로 바꿨어요. 비밀번호는 그대로 쓰면 됩니다.`);
  console.log("주의: 서버가 켜져 있으면 메모리 캐시가 옛 내용을 덮어쓸 수 있어요. 서버를 내린 상태에서 실행하거나, 실행 후 재시작하세요.");
})();
