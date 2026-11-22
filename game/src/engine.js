// Wayang Clash — the rules, as pure state. No drawing, no input, no sound:
// this file can be driven headless, which is how the screenshots and the
// play-tests stage a whole game. Two dalang, three lanes, 20 life each.
//
// A round: the player draws and gains energy, plays cards into lanes, then
// ends the turn. The AI draws, plays, then every lane clashes at once: two
// cards in one lane trade ATK into each other's DEF (DEF is health); a card
// facing an empty lane hits the enemy dalang's life instead. First dalang to
// 0 life loses; an empty deck bites back with growing fatigue damage.

import { LANES, MAX_ENERGY, MAX_HAND, MAX_ROUNDS, START_ENERGY, START_HAND, START_LIFE } from './config.js';
import { DECK_LIST, makeCard } from './deck.js';
import { pick, shuffle } from './random.js';

export const EVENT_PLAY = 'play';
export const EVENT_ATTACK = 'attack';
export const EVENT_DESTROY = 'destroy';
export const EVENT_DAMAGE = 'damage';
export const EVENT_HEAL = 'heal';
export const EVENT_DRAW = 'draw';
export const EVENT_FATIGUE = 'fatigue';
export const EVENT_WIN = 'win';

let nextUid = 1;

function makePlayer(rng) {
  const deck = shuffle(DECK_LIST, rng).map((id) => makeCard(id, nextUid++));
  const hand = [];
  for (let i = 0; i < START_HAND; i += 1) hand.push(deck.pop());
  return {
    life: START_LIFE,
    deck,
    hand,
    lanes: [null, null, null],
    energy: START_ENERGY,
    maxEnergy: START_ENERGY,
    fatigue: 0,
    destroyed: 0,
    damageDealt: 0,
  };
}

export function createGame(rng) {
  nextUid = 1;
  const game = {
    rng,
    players: [makePlayer(rng), makePlayer(rng)],
    turn: 0, // 0 = you, 1 = the AI dalang
    round: 1,
    phase: 'play', // play | over
    winner: null, // 0 | 1 | null
    log: ['Duel dimulai — giliranmu, Dalang.'],
    cardsPlayed: 0,
  };
  return game;
}

export function enemyOf(player) {
  return 1 - player;
}

export function isOver(game) {
  return game.phase === 'over';
}

function pushLog(game, message) {
  game.log.push(message);
  if (game.log.length > 6) game.log.shift();
}

/** Draw one card for `player`; an empty deck deals growing fatigue damage. */
export function drawCard(game, player, events) {
  const side = game.players[player];
  if (side.deck.length === 0) {
    side.fatigue += 1;
    side.life -= side.fatigue;
    events.push({ type: EVENT_FATIGUE, player, amount: side.fatigue });
    pushLog(game, `${player === 0 ? 'Kamu' : 'Lawan'} kehabisan kartu — fatigue ${side.fatigue}!`);
    checkEnd(game, events);
    return null;
  }
  if (side.hand.length >= MAX_HAND) return null;
  const card = side.deck.pop();
  side.hand.push(card);
  events.push({ type: EVENT_DRAW, player, card });
  return card;
}

/** Start a turn for `player`: energy refills and grows with the round, then draw one card. */
export function startTurn(game, player, events) {
  const side = game.players[player];
  side.maxEnergy = Math.min(MAX_ENERGY, game.round);
  side.energy = side.maxEnergy;
  drawCard(game, player, events);
}

/** Resolve a card's on-play power. Returns nothing; appends events. */
export function applyPower(game, player, card, events) {
  const me = game.players[player];
  const foe = game.players[enemyOf(player)];
  switch (card.power) {
    case 'strike1':
      foe.life -= 1;
      me.damageDealt += 1;
      events.push({ type: EVENT_DAMAGE, player: enemyOf(player), amount: 1, direct: true });
      pushLog(game, `${card.name}: Panah Sakti — 1 damage ke dalang lawan.`);
      break;
    case 'strike2':
      foe.life -= 2;
      me.damageDealt += 2;
      events.push({ type: EVENT_DAMAGE, player: enemyOf(player), amount: 2, direct: true });
      pushLog(game, `${card.name}: Tidur Panjang — 2 damage ke dalang lawan.`);
      break;
    case 'splash1': {
      let hit = 0;
      foe.lanes.forEach((c, lane) => {
        if (c) {
          c.def -= 1;
          hit += 1;
          events.push({ type: EVENT_DAMAGE, player: enemyOf(player), lane, amount: 1 });
          if (c.def <= 0) destroyLaneCard(game, enemyOf(player), lane, events);
        }
      });
      if (hit > 0) pushLog(game, `${card.name}: ${hit} kartu lawan terkena 1 damage.`);
      break;
    }
    case 'random1': {
      const filled = foe.lanes.map((c, lane) => (c ? lane : -1)).filter((l) => l >= 0);
      if (filled.length > 0) {
        const lane = pick(filled, game.rng);
        const target = foe.lanes[lane];
        target.def -= 1;
        events.push({ type: EVENT_DAMAGE, player: enemyOf(player), lane, amount: 1 });
        pushLog(game, `${card.name}: 1 damage ke ${target.name}.`);
        if (target.def <= 0) destroyLaneCard(game, enemyOf(player), lane, events);
      }
      break;
    }
    case 'heal2':
    case 'heal3': {
      const amount = card.power === 'heal2' ? 2 : 3;
      me.life = Math.min(START_LIFE, me.life + amount);
      events.push({ type: EVENT_HEAL, player, amount });
      pushLog(game, `${card.name}: pulihkan ${amount} nyawa.`);
      break;
    }
    case 'draw1':
      drawCard(game, player, events);
      pushLog(game, `${card.name}: ambil 1 kartu.`);
      break;
    case 'energy1':
      me.energy += 1;
      events.push({ type: EVENT_DRAW, player, card: null });
      pushLog(game, `${card.name}: +1 energi giliran ini.`);
      break;
    case 'buff2':
      card.def += 2;
      card.maxDef += 2;
      pushLog(game, `${card.name}: +2 DEF.`);
      break;
    default:
      break;
  }
}

function destroyLaneCard(game, player, lane, events) {
  const side = game.players[player];
  const card = side.lanes[lane];
  if (!card) return;
  side.lanes[lane] = null;
  game.players[enemyOf(player)].destroyed += 1;
  events.push({ type: EVENT_DESTROY, player, lane, name: card.name });
  pushLog(game, `${card.name} hancur!`);
}

/** Can `player` play hand[handIndex] into `lane` right now? */
export function canPlay(game, player, handIndex, lane) {
  if (game.phase !== 'play' || game.turn !== player) return false;
  const side = game.players[player];
  const card = side.hand[handIndex];
  if (!card) return false;
  if (lane < 0 || lane >= LANES) return false;
  if (side.lanes[lane]) return false;
  return side.energy >= card.cost;
}

/** Play hand[handIndex] into `lane`. Returns the events it caused. */
export function playCard(game, player, handIndex, lane) {
  const events = [];
  if (!canPlay(game, player, handIndex, lane)) return events;
  const side = game.players[player];
  const card = side.hand.splice(handIndex, 1)[0];
  side.energy -= card.cost;
  side.lanes[lane] = card;
  game.cardsPlayed += 1;
  events.push({ type: EVENT_PLAY, player, lane, card });
  pushLog(game, `${player === 0 ? 'Kamu memainkan' : 'Lawan memainkan'} ${card.name} (jalur ${lane + 1}).`);
  applyPower(game, player, card, events);
  checkEnd(game, events);
  return events;
}

/** Every lane clashes at once: cards trade ATK into DEF; an unopposed card hits life. */
export function resolveCombat(game) {
  const events = [];
  const [me, foe] = game.players;
  const damageTo = [0, 0]; // life damage dealt to each side
  const cardDamage = [[0, 0, 0], [0, 0, 0]];
  for (let lane = 0; lane < LANES; lane += 1) {
    const a = me.lanes[lane];
    const b = foe.lanes[lane];
    if (a && b) {
      cardDamage[0][lane] = b.atk;
      cardDamage[1][lane] = a.atk;
      events.push({ type: EVENT_ATTACK, lane, a: a.name, b: b.name });
    } else if (a) {
      damageTo[1] += a.atk;
      events.push({ type: EVENT_ATTACK, lane, a: a.name, direct: true });
    } else if (b) {
      damageTo[0] += b.atk;
      events.push({ type: EVENT_ATTACK, lane, b: b.name, direct: true });
    }
  }
  for (let lane = 0; lane < LANES; lane += 1) {
    for (let p = 0; p < 2; p += 1) {
      const card = game.players[p].lanes[lane];
      if (card && cardDamage[p][lane] > 0) {
        card.def -= cardDamage[p][lane];
        events.push({ type: EVENT_DAMAGE, player: p, lane, amount: cardDamage[p][lane] });
      }
    }
  }
  for (let lane = 0; lane < LANES; lane += 1) {
    for (let p = 0; p < 2; p += 1) {
      const card = game.players[p].lanes[lane];
      if (card && card.def <= 0) destroyLaneCard(game, p, lane, events);
    }
  }
  if (damageTo[0] > 0) {
    me.life -= damageTo[0];
    foe.damageDealt += damageTo[0];
    events.push({ type: EVENT_DAMAGE, player: 0, amount: damageTo[0], direct: true });
    pushLog(game, `Dalang lawan menyerang langsung: ${damageTo[0]} damage.`);
  }
  if (damageTo[1] > 0) {
    foe.life -= damageTo[1];
    me.damageDealt += damageTo[1];
    events.push({ type: EVENT_DAMAGE, player: 1, amount: damageTo[1], direct: true });
    pushLog(game, `Kartumu menyerang langsung: ${damageTo[1]} damage.`);
  }
  checkEnd(game, events);
  return events;
}

function checkEnd(game, events) {
  const [me, foe] = game.players;
  let winner = null;
  if (me.life <= 0 && foe.life <= 0) winner = me.damageDealt >= foe.damageDealt ? 0 : 1;
  else if (me.life <= 0) winner = 1;
  else if (foe.life <= 0) winner = 0;
  if (winner !== null) {
    game.phase = 'over';
    game.winner = winner;
    events.push({ type: EVENT_WIN, winner });
    pushLog(game, winner === 0 ? 'MENANG! Layar wayang milikmu.' : 'KALAH. Dalang lawan merebut layar.');
  }
}

/** End the player's turn: the AI plays, then the lanes clash, then your next turn. */
export function endTurn(game, aiPlay, events) {
  if (game.phase !== 'play' || game.turn !== 0) return events;
  game.turn = 1;
  startTurn(game, 1, events);
  if (!isOver(game)) aiPlay(game, events);
  if (!isOver(game)) resolveCombat(game);
  if (!isOver(game)) {
    game.round += 1;
    if (game.round > MAX_ROUNDS) {
      // Fatigue decides a duel that drags on forever: lower life loses.
      game.phase = 'over';
      game.winner = game.players[0].life >= game.players[1].life ? 0 : 1;
      events.push({ type: EVENT_WIN, winner: game.winner });
    } else {
      game.turn = 0;
      startTurn(game, 0, events);
    }
  }
  return events;
}
