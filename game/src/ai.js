// Wayang Clash — the AI dalang. It reads the table and counters what it sees:
// it kills a card it can kill, blocks a lane that would hit its life, and
// otherwise plays its best-value card into the lane where it trades best.
// Greedy, but its choices are readable — and counterable.

import { LANES } from './config.js';
import { canPlay, playCard } from './engine.js';

/** Value of a card on the table: stats per cost, with a small power bonus. */
function cardValue(card) {
  const powerBonus = card.power === 'draw1' ? 1.5 : card.power === 'heal3' ? 1.5 : 1;
  return (card.atk + card.def) / Math.max(1, card.cost) + powerBonus;
}

/** The lane the AI prefers for `card`: kill, block, then best trade. */
function chooseLane(game, card) {
  const me = game.players[1];
  const foe = game.players[0];
  // 1. Kill: a lane where this card destroys the enemy card outright.
  for (let lane = 0; lane < LANES; lane += 1) {
    const target = foe.lanes[lane];
    if (!me.lanes[lane] && target && card.atk >= target.def) return lane;
  }
  // 2. Block: a lane where the enemy card would otherwise hit our life.
  for (let lane = 0; lane < LANES; lane += 1) {
    if (!me.lanes[lane] && foe.lanes[lane]) return lane;
  }
  // 3. Best trade: the empty lane facing the weakest enemy card.
  let bestLane = -1;
  let bestScore = -1;
  for (let lane = 0; lane < LANES; lane += 1) {
    if (me.lanes[lane]) continue;
    const target = foe.lanes[lane];
    const score = target ? target.def - card.atk : 2;
    if (score > bestScore) {
      bestScore = score;
      bestLane = lane;
    }
  }
  return bestLane;
}

/** Play the AI's whole turn: keep playing its best affordable card. */
export function aiTakeTurn(game, events) {
  const me = game.players[1];
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    let bestHand = -1;
    let bestValue = 0;
    for (let i = 0; i < me.hand.length; i += 1) {
      const card = me.hand[i];
      if (card.cost > me.energy) continue;
      const value = cardValue(card);
      if (value > bestValue) {
        bestValue = value;
        bestHand = i;
      }
    }
    if (bestHand < 0) break;
    const card = me.hand[bestHand];
    const lane = chooseLane(game, card);
    if (lane < 0) break;
    if (!canPlay(game, 1, bestHand, lane)) break;
    playCard(game, 1, bestHand, lane).forEach((e) => events.push(e));
  }
}

/** The same greedy brain, for the player's autopilot in screenshots and tests:
// play every affordable card, best value first, into its best lane. */
export function autopilotPlay(game, player, events) {
  const side = game.players[player];
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    let bestHand = -1;
    let bestValue = 0;
    for (let i = 0; i < side.hand.length; i += 1) {
      const card = side.hand[i];
      if (card.cost > side.energy) continue;
      const value = cardValue(card);
      if (value > bestValue) {
        bestValue = value;
        bestHand = i;
      }
    }
    if (bestHand < 0) break;
    // Autopilot lanes: prefer killing, then blocking, then the first free lane.
    const me = side;
    const foe = game.players[1 - player];
    const card = side.hand[bestHand];
    let lane = -1;
    for (let l = 0; l < LANES && lane < 0; l += 1) {
      const target = foe.lanes[l];
      if (!me.lanes[l] && target && card.atk >= target.def) lane = l;
    }
    for (let l = 0; l < LANES && lane < 0; l += 1) {
      if (!me.lanes[l] && foe.lanes[l]) lane = l;
    }
    for (let l = 0; l < LANES && lane < 0; l += 1) {
      if (!me.lanes[l]) lane = l;
    }
    if (lane < 0) break;
    playCard(game, player, bestHand, lane).forEach((e) => events.push(e));
  }
}
