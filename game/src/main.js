// Wayang Clash — boot and the one loop. The game moves between three screens:
// title, play (the wayang table) and over (win / loss, drawn over the table).
// Input is read every frame; the world advances only when the player acts, so
// the loop is just input + paint + the small animations (floaters, confetti).
//
// ?seed=N fixes the deal. ?shot=title|play|win|loss stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady for a
// screenshot. ?autoplay=1 plays a whole game with the autopilot (a headless
// test hook) and reports WIN or LOSS in the status line.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createGame, endTurn, isOver, playCard, startTurn } from './engine.js';
import { aiTakeTurn, autopilotPlay } from './ai.js';
import {
  ACTION_CONFIRM,
  ACTION_END,
  ACTION_ESC,
  ACTION_LEFT,
  ACTION_RESTART,
  ACTION_RIGHT,
  createInput,
} from './input.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createRenderer,
  endTurnRect,
  handCardRect,
  laneRect,
  restartRect,
  startRect,
} from './render.js';
import { stageShot } from './shots.js';
import {
  clashSound,
  healSound,
  lossSound,
  playCardSound,
  unlockAudio,
  winSound,
} from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const autoplay = params.get('autoplay') === '1';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

const CONFETTI_COLORS = ['#f7c948', '#d64545', '#2aa198', '#8e44ad', '#f5e9c8'];

function readWins() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveWins(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): wins then last this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

// Any uncaught error is reported in the status line, so a headless run can see it.
window.addEventListener('error', (event) => {
  window.__errors = window.__errors || [];
  window.__errors.push(String(event.message));
  announce(`ERROR: ${event.message}`);
});

const ui = {
  selected: -1,
  floaters: [],
  confetti: [],
  busyUntil: 0,
};

let wins = readWins();
let screen = SCREEN_TITLE;
let game = createGame(createRandom(seed));

function addFloater(x, y, textValue, color) {
  ui.floaters.push({ x, y, text: textValue, color, t: 0 });
}

function burstConfetti() {
  for (let i = 0; i < 90; i += 1) {
    ui.confetti.push({
      x: 120 + Math.random() * 1040,
      y: -20 - Math.random() * 120,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      t: Math.random() * 0.6,
    });
  }
}

/** Turn engine events into sounds and floating numbers. */
function processEvents(events) {
  for (const event of events) {
    if (event.type === 'play') {
      playCardSound();
      const r = laneRect(event.player, event.lane);
      addFloater(r.x + r.w / 2, r.y + r.h / 2, event.card.name, '#f5e9c8');
    } else if (event.type === 'attack') {
      clashSound();
    } else if (event.type === 'damage' && event.direct) {
      const y = event.player === 0 ? 565 : 53;
      addFloater(340, y, `-${event.amount}`, '#ff8a7a');
    } else if (event.type === 'damage' && event.lane !== undefined) {
      const r = laneRect(event.player, event.lane);
      addFloater(r.x + r.w / 2, r.y + 10, `-${event.amount}`, '#ff8a7a');
    } else if (event.type === 'destroy') {
      const r = laneRect(event.player, event.lane);
      addFloater(r.x + r.w / 2, r.y + r.h / 2, 'HANCUR!', '#e74c3c');
    } else if (event.type === 'heal') {
      healSound();
      const y = event.player === 0 ? 565 : 53;
      addFloater(340, y, `+${event.amount}`, '#58b368');
    } else if (event.type === 'fatigue') {
      const y = event.player === 0 ? 565 : 53;
      addFloater(340, y, `FATIGUE -${event.amount}`, '#e67e22');
    } else if (event.type === 'win') {
      if (event.winner === 0) {
        wins += 1;
        saveWins(wins);
        burstConfetti();
        winSound();
        announce(`MENANG! Kemenangan ke-${wins}.`);
      } else {
        lossSound();
        announce('KALAH. Dalang lawan merebut layar.');
      }
    }
  }
}

function startGame() {
  game = createGame(createRandom(seed));
  const events = [];
  startTurn(game, 0, events);
  ui.selected = -1;
  ui.floaters = [];
  ui.confetti = [];
  screen = SCREEN_PLAY;
  announce('Duel dimulai. Pilih kartu, lalu klik jalur.');
}

function doEndTurn() {
  if (game.turn !== 0 || game.phase !== 'play') return;
  ui.selected = -1;
  const events = [];
  endTurn(game, aiTakeTurn, events);
  processEvents(events);
  ui.busyUntil = performance.now() + 450;
}

function tryPlaySelected(lane) {
  if (ui.selected < 0) return;
  const events = playCard(game, 0, ui.selected, lane);
  if (events.length > 0) {
    processEvents(events);
    ui.selected = -1;
  }
}

function firstFreeLane() {
  for (let lane = 0; lane < 3; lane += 1) {
    if (!game.players[0].lanes[lane]) return lane;
  }
  return -1;
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function handleClick(x, y) {
  unlockAudio();
  if (screen === SCREEN_TITLE) {
    startGame();
    return;
  }
  if (game.phase === 'over') {
    if (inside(restartRect(), x, y)) startGame();
    return;
  }
  if (performance.now() < ui.busyUntil) return;
  if (inside(endTurnRect(), x, y)) {
    doEndTurn();
    return;
  }
  // Your hand first (topmost card wins the click).
  const hand = game.players[0].hand;
  for (let i = hand.length - 1; i >= 0; i -= 1) {
    if (inside(handCardRect(i, hand.length), x, y)) {
      ui.selected = ui.selected === i ? -1 : i;
      return;
    }
  }
  // Then your lanes, when a card is selected.
  if (ui.selected >= 0) {
    for (let lane = 0; lane < 3; lane += 1) {
      if (inside(laneRect(0, lane), x, y)) {
        tryPlaySelected(lane);
        return;
      }
    }
  }
}

function runShot(name) {
  const staged = stageShot(name, createRandom(seed));
  game = staged.game;
  screen = staged.screen;
  if (staged.screen === SCREEN_OVER && staged.game.winner === 0) {
    wins += 1;
    burstConfetti();
  }
  let painted = 0;
  function paint() {
    renderer.draw(screen, game, ui, wins, performance.now());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      const ready = document.getElementById('shot-ready');
      if (ready) ready.textContent = 'ready';
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let last = performance.now();
  let lastAuto = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, STEP * 4);
    last = now;

    // Animations advance in real time.
    ui.floaters.forEach((f) => {
      f.t += dt;
    });
    ui.floaters = ui.floaters.filter((f) => f.t < 1.1);
    ui.confetti.forEach((p) => {
      p.t += dt;
    });
    ui.confetti = ui.confetti.filter((p) => p.t < 2.2);

    // Headless test hook: the autopilot plays both sides to a finish.
    if (autoplay && screen === SCREEN_PLAY && !isOver(game) && now - lastAuto > 120) {
      lastAuto = now;
      const events = [];
      autopilotPlay(game, 0, events);
      processEvents(events);
      if (!isOver(game)) {
        const more = [];
        endTurn(game, aiTakeTurn, more);
        processEvents(more);
      }
      if (isOver(game)) announce(`AUTOPLAY RESULT: ${game.winner === 0 ? 'WIN' : 'LOSS'}`);
    }

    const actions = input.takeActions();
    const digit = input.takeDigit();
    if (digit > 0 && screen === SCREEN_PLAY && digit <= game.players[0].hand.length) {
      ui.selected = digit - 1;
    }
    if (actions & ACTION_LEFT) ui.selected = Math.max(0, ui.selected - 1);
    if (actions & ACTION_RIGHT) {
      ui.selected = Math.min(game.players[0].hand.length - 1, ui.selected + 1);
    }
    if (actions & ACTION_ESC) ui.selected = -1;
    if (actions & ACTION_RESTART && (screen === SCREEN_PLAY || game.phase === 'over')) startGame();
    if (actions & ACTION_END) doEndTurn();
    if (actions & ACTION_CONFIRM) {
      unlockAudio();
      if (screen === SCREEN_TITLE) startGame();
      else if (game.phase === 'over') startGame();
      else if (ui.selected >= 0) {
        const lane = firstFreeLane();
        if (lane >= 0) tryPlaySelected(lane);
      } else doEndTurn();
    }
    for (const click of input.takeClicks()) handleClick(click.x, click.y);

    renderer.draw(screen, game, ui, wins, now);
  }

  announce('Wayang Clash. Tekan Spasi atau klik untuk mulai.');
  // Headless test hook: start the duel at once so the autopilot can play it.
  if (autoplay) startGame();
  requestAnimationFrame(frame);
}

// A debug handle for headless play-tests: the live game and screen.
window.__wayang = {
  get game() {
    return game;
  },
  get screen() {
    return screen;
  },
  get wins() {
    return wins;
  },
};

if (shot) runShot(shot);
else runGame();
