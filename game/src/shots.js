// Wayang Clash — the screenshot scenes behind ?shot=title|play|win|loss.
// Each one plays the real rules forward from a fresh game with a fixed seed,
// steered by the same greedy autopilot both sides use, so the frame is what a
// real game looks like and the same seed always gives the same frame.

import { createGame, endTurn, isOver, startTurn } from './engine.js';
import { aiTakeTurn, autopilotPlay } from './ai.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const PLAY_ROUNDS = 4;
const MAX_TURNS = 400;

/** Play one full autopilot game from a fresh deal; returns the finished game. */
function playFullGame(rng) {
  const game = createGame(rng);
  const events = [];
  startTurn(game, 0, events);
  let guard = 0;
  while (!isOver(game) && guard < MAX_TURNS) {
    guard += 1;
    autopilotPlay(game, 0, events);
    if (isOver(game)) break;
    endTurn(game, aiTakeTurn, events);
  }
  return game;
}

/**
 * Set up the named scene and return the screen to draw over it.
 * title: a fresh table behind the title screen.
 * play: a mid-game table (round 4, lanes filled, both hands full).
 * win: a finished game the player won. loss: a finished game the AI won.
 */
export function stageShot(name, rng) {
  if (name === 'win' || name === 'loss') {
    const want = name === 'win' ? 0 : 1;
    let game = playFullGame(rng);
    for (let attempt = 0; attempt < 30 && game.winner !== want; attempt += 1) {
      game = playFullGame(rng);
    }
    return { screen: SCREEN_OVER, game };
  }
  const game = createGame(rng);
  const events = [];
  startTurn(game, 0, events);
  if (name !== 'play') return { screen: SCREEN_TITLE, game };
  let guard = 0;
  while (!isOver(game) && game.round < PLAY_ROUNDS && guard < MAX_TURNS) {
    guard += 1;
    autopilotPlay(game, 0, events);
    if (isOver(game)) break;
    endTurn(game, aiTakeTurn, events);
  }
  if (!isOver(game) && game.turn === 0) autopilotPlay(game, 0, events);
  return { screen: isOver(game) ? SCREEN_OVER : SCREEN_PLAY, game };
}
