// Wayang Clash — every tuning number and colour in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds. */
export const STEP = 1 / 60;

/** A duel lasts at most this many full rounds before fatigue decides it. */
export const MAX_ROUNDS = 60;

/** Life each dalang starts with. */
export const START_LIFE = 20;

/** Cards drawn at the start, and the most a hand may hold. */
export const START_HAND = 4;
export const MAX_HAND = 7;

/** Energy: starts at 1, grows by 1 each of your turns, caps here. */
export const START_ENERGY = 1;
export const MAX_ENERGY = 6;

/** Damage taken when you must draw from an empty deck (grows each time). */
export const FATIGUE_START = 1;

/** Three lanes across the wayang screen. */
export const LANES = 3;

/** Card and lane geometry on the 1280x720 table. */
export const LAYOUT = {
  laneCardW: 112,
  laneCardH: 152,
  laneYEnemy: 132,
  laneYPlayer: 330,
  laneCenters: [440, 640, 840],
  handCardW: 118,
  handCardH: 146,
  handY: 572,
  miniCardW: 64,
  miniCardH: 84,
  miniY: 8,
};

/** Where the best (most wins) is kept between visits (this browser only). */
export const BEST_KEY = 'wayang-clash.wins';

export const PALETTE = {
  backdrop: '#171009',
  screen: '#241a0e',
  screenGlow: '#f7c948',
  table: '#2e2113',
  tableEdge: '#6b4a1f',
  panel: '#1d140a',
  panelEdge: '#8a6a35',
  text: '#f5e9c8',
  muted: '#b39b6d',
  enemy: '#c0392b',
  player: '#2e86c1',
  gold: '#f7c948',
  endTurn: '#b7791f',
  endTurnText: '#fff7e0',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
