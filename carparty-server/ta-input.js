"use strict";

/* =============================================================================
 *  ta-input.js — 타임어택 기록에 붙는 "사람이 몰았나" 판정
 * -----------------------------------------------------------------------------
 *  v4 에서 클라는 위치가 아니라 버튼 비트만 보내고 물리·기록은 서버가 계산한다.
 *  그래서 속도핵·순간이동·기록 위조는 프로토콜 수준에서 이미 불가능하다.
 *  남은 구멍은 하나뿐이다 — "사람 대신 프로그램이 버튼을 누르는 것"(봇).
 *  봇은 규칙을 어기지 않는다. 사람이 낼 수 없는 정밀도로 정직하게 몰 뿐이다.
 *
 *  그걸 가르는 건 주행 궤적이 아니라 손가락의 물리적 한계다.
 *   · 사람은 조향키를 한 번 누르면 최소 수십 ms 는 붙잡고 있다. 60Hz 기준
 *     1~2틱(16~33ms)짜리 조향이 무더기로 나오는 건 키보드로 낼 수 없는 값이다.
 *     클라는 틱마다 키 상태를 샘플링하므로 프레임이 낮은 기기일수록 홀드가
 *     오히려 길어진다 — 짧은 홀드는 저사양 쪽으로 오탐이 나지 않는다.
 *   · 봇은 틱 단위 최적 제어를 하므로 조향 상태 전환이 초당 수십 번 일어난다.
 *
 *  판정은 두 단계다. 오탐으로 정상 기록을 지우는 쪽이 치터 하나 놓치는 것보다
 *  훨씬 손해라, 사람이 도달할 수 있는 값에는 손대지 않는다.
 *   · suspect     기록은 그대로 저장하고 로그 + 관리자 알림만. 판단은 사람이 한다.
 *   · impossible  사람 손으로 낼 수 없는 값. 기록을 저장하지 않는다.
 *
 *  임계값은 실제 로그(ta-suspect.jsonl)를 보고 조정하라고 여기 모아 뒀다.
 *  지그재그 코스(serp)처럼 조향이 원래 잦은 모드가 있어 넉넉하게 잡혀 있다.
 * ========================================================================== */

const SIM = require("./sim.js");

const STEER_MASK = SIM.BTN.A | SIM.BTN.D; // 좌/우 조향만 본다 (W 는 계속 눌린 채라 정보가 없다)
const FLICK_TICKS = 3;   // 이 이하로 짧은 조향 유지 = "플릭"(50ms). 사람 손의 하한 근처.
const MIN_HOLDS = 20;    // 표본이 이보다 적으면 통계로 안 본다 (짧은 코스 보호)
const SUSPECT = { flipRate: 16, flickFrac: 0.50 };    // 초당 조향 전환 / 플릭 비율
const IMPOSSIBLE = { flipRate: 25, flickFrac: 0.75 };

/* 한 번의 계측 주행에 대한 누적기. 주행 시작(attackStep "start")마다 새로 만든다. */
function create() {
  return { ticks: 0, flips: 0, holds: 0, flicks: 0, hold1: 0, holdTicks: 0, last: -1 };
}

/* 계측 중인 틱마다 1회. 그 틱에 서버가 확정한 buttons 를 넘긴다. */
function tick(st, buttons) {
  if (!st) return;
  st.ticks++;
  const steer = buttons & STEER_MASK;
  if (steer !== st.last) {
    if (st.last >= 0) {           // 첫 틱은 "전환"이 아니라 시작점이다
      st.holds++;
      if (st.holdTicks <= FLICK_TICKS) st.flicks++;
      if (st.holdTicks <= 1) st.hold1++; // 1틱(16ms) 조향 — 물리 키보드로는 무더기로 안 나온다
      st.flips++;
    }
    st.last = steer;
    st.holdTicks = 0;
  }
  st.holdTicks++;
}

/* 누적기 → { verdict, ... }. 표본이 적으면 언제나 ok. */
function verdict(st) {
  if (!st || st.holds < MIN_HOLDS || st.ticks <= 0) return { verdict: "ok", holds: st ? st.holds : 0 };
  const secs = st.ticks / SIM.TICK_RATE;
  const flipRate = st.flips / secs;
  const flickFrac = st.flicks / st.holds;
  const v =
    (flipRate >= IMPOSSIBLE.flipRate && flickFrac >= IMPOSSIBLE.flickFrac) ? "impossible"
    : (flipRate >= SUSPECT.flipRate && flickFrac >= SUSPECT.flickFrac) ? "suspect"
    : "ok";
  return {
    verdict: v,
    flipRate: +flipRate.toFixed(2),
    flickFrac: +flickFrac.toFixed(3),
    holds: st.holds,
    hold1: st.hold1,
    ticks: st.ticks,
  };
}

module.exports = { create, tick, verdict, STEER_MASK, FLICK_TICKS, MIN_HOLDS, SUSPECT, IMPOSSIBLE };
