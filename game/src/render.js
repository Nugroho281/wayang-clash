// Wayang Clash — everything the player sees, painted on one canvas.
// Screens: title, play (the wayang table), over (win / loss). The table is a
// shadow-puppet screen under a lamp: the enemy dalang's hand across the top,
// three lanes in the middle, your hand along the bottom. A card shows its suit
// by colour AND by glyph (sword / crescent / star / horn), its name, its
// ATK (sword) and DEF (shield), its COST in the corner, and its power in one
// line. Geometry helpers are exported so main.js can hit-test clicks.

import { FIELD, LAYOUT, PALETTE, FONT } from './config.js';
import { SUITS } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const GOLD = PALETTE.gold;

/** A card's rectangle in your hand (cards are centred, overlapping a little). */
export function handCardRect(index, count) {
  const w = LAYOUT.handCardW;
  const h = LAYOUT.handCardH;
  const gap = Math.min(122, (FIELD.width - 320) / Math.max(1, count));
  const total = gap * (count - 1) + w;
  const x0 = (FIELD.width - total) / 2;
  return { x: x0 + index * gap, y: LAYOUT.handY, w, h };
}

/** A lane slot's rectangle: player 0 = you (bottom), 1 = the enemy (top). */
export function laneRect(player, lane) {
  const w = LAYOUT.laneCardW;
  const h = LAYOUT.laneCardH;
  const x = LAYOUT.laneCenters[lane] - w / 2;
  const y = player === 0 ? LAYOUT.laneYPlayer : LAYOUT.laneYEnemy;
  return { x, y, w, h };
}

/** The enemy hand's mini-card rectangle. */
export function miniCardRect(index, count) {
  const w = LAYOUT.miniCardW;
  const h = LAYOUT.miniCardH;
  const gap = 72;
  const total = gap * (count - 1) + w;
  const x0 = (FIELD.width - total) / 2;
  return { x: x0 + index * gap, y: LAYOUT.miniY, w, h };
}

export function endTurnRect() {
  return { x: 1120, y: 600, w: 132, h: 52 };
}

export function startRect() {
  return { x: 490, y: 520, w: 300, h: 64 };
}

export function restartRect() {
  return { x: 490, y: 520, w: 300, h: 64 };
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function hitRects() {
  return { inside, handCardRect, laneRect, miniCardRect, endTurnRect, startRect, restartRect };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Draw one suit glyph: sword, crescent moon, five-point star, horned mask.
 * `bg` is the colour behind the glyph (the card's suit band): the moon cuts a
 * crescent out of its own disc by painting the offset circle in `bg`. */
export function drawGlyph(ctx, glyph, cx, cy, size, color, bg = null) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size / 12);
  ctx.lineJoin = 'round';
  if (glyph === 'sword') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx + size / 8, cy - size / 8);
    ctx.lineTo(cx + size / 8, cy + size / 4);
    ctx.lineTo(cx - size / 8, cy + size / 4);
    ctx.lineTo(cx - size / 8, cy - size / 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - size / 3, cy + size / 4);
    ctx.lineTo(cx + size / 3, cy + size / 4);
    ctx.lineWidth = size / 8;
    ctx.stroke();
    ctx.fillRect(cx - size / 16, cy + size / 4, size / 8, size / 4);
  } else if (glyph === 'moon') {
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Cut the crescent: paint the offset disc in the background colour.
    ctx.fillStyle = bg ?? '#f7ead0';
    ctx.beginPath();
    ctx.arc(cx + size / 4, cy - size / 8, size / 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? size / 2 : size / 5;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // horn: two curved horns over a mask band.
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy + size / 6);
    ctx.quadraticCurveTo(cx - size / 2, cy - size / 2, cx - size / 8, cy - size / 3);
    ctx.quadraticCurveTo(cx - size / 3, cy - size / 8, cx - size / 4, cy + size / 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + size / 2, cy + size / 6);
    ctx.quadraticCurveTo(cx + size / 2, cy - size / 2, cx + size / 8, cy - size / 3);
    ctx.quadraticCurveTo(cx + size / 3, cy - size / 8, cx + size / 4, cy + size / 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + size / 6, size / 3, size / 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.45);
  ctx.bezierCurveTo(cx - size, cy - size * 0.2, cx - size * 0.45, cy - size * 0.8, cx, cy - size * 0.15);
  ctx.bezierCurveTo(cx + size * 0.45, cy - size * 0.8, cx + size, cy - size * 0.2, cx, cy + size * 0.45);
  ctx.fill();
  ctx.restore();
}

function drawShield(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size / 2);
  ctx.quadraticCurveTo(cx - size / 2, cy + size / 5, cx - size / 2, cy - size / 3);
  ctx.lineTo(cx + size / 2, cy - size / 3);
  ctx.quadraticCurveTo(cx + size / 2, cy + size / 5, cx, cy + size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** One card face. `mini` shrinks the power line away; `faceDown` hides it. */
export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const { mini = false, selected = false, dimmed = false, faceDown = false } = opts;
  const suit = SUITS[card.suit];
  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.45;
  // Card body: cream face, suit-coloured frame.
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#f7ead0';
  ctx.fill();
  ctx.lineWidth = selected ? 5 : 3;
  ctx.strokeStyle = selected ? GOLD : suit.color;
  ctx.stroke();
  if (faceDown) {
    roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 7);
    ctx.fillStyle = suit.dark;
    ctx.fill();
    drawGlyph(ctx, suit.glyph, x + w / 2, y + h / 2, Math.min(w, h) * 0.5, suit.color);
    ctx.restore();
    return;
  }
  // Cost orb, top-left.
  const orbR = mini ? 10 : 13;
  const orbX = x + (mini ? 12 : 16);
  const orbY = y + (mini ? 12 : 16);
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  text(ctx, String(card.cost), orbX, orbY + 1, mini ? 12 : 16, '#ffffff');
  // Suit band with the glyph.
  ctx.fillStyle = suit.color;
  if (mini) {
    ctx.fillRect(x + 3, y + 26, w - 6, 24);
    drawGlyph(ctx, suit.glyph, x + w / 2, y + 38, 17, '#fff7e0', suit.color);
    const shortName = card.name.length > 7 ? `${card.name.slice(0, 7)}…` : card.name;
    text(ctx, shortName.toUpperCase(), x + w / 2, y + 62, 9, '#2c1e0e');
    drawGlyph(ctx, 'sword', x + 11, y + h - 10, 11, '#c0392b');
    text(ctx, String(card.atk), x + 19, y + h - 9, 11, '#7e2222', 'left');
    drawShield(ctx, x + w - 20, y + h - 10, 12, '#2e86c1');
    text(ctx, String(card.def), x + w - 13, y + h - 9, 11, '#1a5276', 'left');
    ctx.restore();
    return;
  }
  ctx.fillRect(x + 4, y + 34, w - 8, 44);
  drawGlyph(ctx, suit.glyph, x + w / 2, y + 56, 30, '#fff7e0', suit.color);
  // Name.
  text(ctx, card.name.toUpperCase(), x + w / 2, y + 90, 15, '#2c1e0e');
  // Power text, wrapped to two lines above the ATK/DEF row.
  ctx.fillStyle = '#5a4630';
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'center';
  const words = card.text.split(' ');
  let line = '';
  let ly = y + 102;
  for (const word of words) {
    if (ctx.measureText(`${line} ${word}`.trim()).width > w - 10 && line) {
      ctx.fillText(line, x + w / 2, ly);
      line = word;
      ly += 12;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  ctx.fillText(line, x + w / 2, ly);
  // ATK (sword) bottom-left, DEF (shield) bottom-right.
  drawGlyph(ctx, 'sword', x + 20, y + h - 14, 16, '#c0392b');
  text(ctx, String(card.atk), x + 34, y + h - 13, 16, '#7e2222', 'left');
  drawShield(ctx, x + w - 34, y + h - 14, 18, '#2e86c1');
  text(ctx, String(card.def), x + w - 20, y + h - 13, 16, '#1a5276', 'left');
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, maxLife, label, alignLeft) {
  text(ctx, label, x, y - 14, 15, PALETTE.text, alignLeft ? 'left' : 'right');
  ctx.fillStyle = '#3a2a16';
  roundRect(ctx, x, y, w, 18, 9);
  ctx.fill();
  const frac = Math.max(0, life) / maxLife;
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#e67e22' : '#c0392b';
  if (frac > 0) {
    roundRect(ctx, x, y, Math.max(10, w * frac), 18, 9);
    ctx.fill();
  }
  drawHeart(ctx, x + w + 16, y + 9, 11, '#e74c3c');
  text(ctx, String(Math.max(0, life)), x + w + 34, y + 10, 18, PALETTE.text, 'left');
}

function drawEnergy(ctx, x, y, energy, maxEnergy) {
  text(ctx, 'ENERGI', x, y - 12, 12, PALETTE.muted, 'left');
  for (let i = 0; i < maxEnergy; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 12 + i * 26, y + 8, 10, 0, Math.PI * 2);
    ctx.fillStyle = i < energy ? GOLD : '#4a3a22';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a6a35';
    ctx.stroke();
  }
}

function drawGunungan(ctx, cx, cy, size, color) {
  // The wayang mountain-tree silhouette that crowns the screen.
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx + size * 0.7, cy - size * 0.2, cx + size * 0.45, cy + size * 0.6);
  ctx.lineTo(cx - size * 0.45, cy + size * 0.6);
  ctx.quadraticCurveTo(cx - size * 0.7, cy - size * 0.2, cx, cy - size);
  ctx.fill();
  ctx.fillStyle = 'rgba(247,201,72,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.25, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackdrop(ctx, time) {
  // A warm lamp-lit stage: dark edges, a glowing wayang screen in the middle.
  const g = ctx.createRadialGradient(640, 330, 80, 640, 360, 760);
  g.addColorStop(0, '#3a2a12');
  g.addColorStop(0.55, '#241a0e');
  g.addColorStop(1, '#120c06');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // The screen itself: a lit wayang cloth from y=112 to y=512.
  const glow = 0.75 + Math.sin(time * 0.0012) * 0.06;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(28, 112, FIELD.width - 56, 400);
  ctx.restore();
  ctx.fillStyle = 'rgba(247,220,150,0.92)';
  ctx.fillRect(34, 118, FIELD.width - 68, 388);
  // Batik border: repeating triangles along the screen's edge.
  ctx.fillStyle = '#6b4a1f';
  for (let x = 34; x < FIELD.width - 68; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 118);
    ctx.lineTo(x + 12, 106);
    ctx.lineTo(x + 24, 118);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, 506);
    ctx.lineTo(x + 12, 518);
    ctx.lineTo(x + 24, 506);
    ctx.closePath();
    ctx.fill();
  }
  drawGunungan(ctx, 640, 116, 26, '#6b4a1f');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = FIELD.width * (window.devicePixelRatio || 1);
    canvas.height = FIELD.height * (window.devicePixelRatio || 1);
    canvas.style.width = `${FIELD.width * scale}px`;
    canvas.style.height = `${FIELD.height * scale}px`;
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  function drawTitle(game, wins, time) {
    drawBackdrop(ctx, time);
    // Puppet silhouettes flanking the title: a crowned head over a long robe.
    ctx.save();
    ctx.fillStyle = 'rgba(43,30,14,0.9)';
    function puppet(cx) {
      ctx.beginPath();
      ctx.moveTo(cx - 40, 560);
      ctx.lineTo(cx, 300);
      ctx.lineTo(cx + 40, 560);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, 270, 34, 0, Math.PI * 2);
      ctx.fill();
      // A three-spiked wayang crown.
      for (const dx of [-26, 0, 26]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx - 12, 246);
        ctx.lineTo(cx + dx, 196);
        ctx.lineTo(cx + dx + 12, 246);
        ctx.closePath();
        ctx.fill();
      }
    }
    puppet(190);
    puppet(1090);
    ctx.restore();

    text(ctx, 'WAYANG', 640, 200, 92, '#2c1e0e');
    text(ctx, 'CLASH', 640, 292, 92, '#c0392b');
    text(ctx, 'Duel kartu dalang — tiga jalur, dua puluh nyawa', 640, 352, 22, '#5a4630');
    text(ctx, 'HOW TO PLAY', 640, 396, 16, '#8a6a35');
    const lines = [
      '1.  Mainkan kartu ke jalur kosong — bayar biayanya dengan energi.',
      '2.  Kartu di jalur yang sama saling serang; kartu tanpa lawan menyerang dalang.',
      '3.  Kurangi nyawa dalang lawan dari 20 ke 0 untuk menang.',
      'Klik kartu lalu klik jalur — atau tekan 1-7, lalu Enter. Spasi = akhiri giliran.',
    ];
    lines.forEach((line, i) => text(ctx, line, 640, 420 + i * 22, 16, '#3a2a16', 'center', 'normal'));
    const r = startRect();
    ctx.fillStyle = PALETTE.endTurn;
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    text(ctx, 'MULAI DUEL  ▶', r.x + r.w / 2, r.y + r.h / 2 + 1, 24, PALETTE.endTurnText);
    text(ctx, `Kemenanganmu: ${wins}   •   Tekan SPASI atau klik untuk mulai`, 640, 622, 15, PALETTE.muted, 'center', 'normal');
  }

  function drawTable(game, ui, wins, time) {
    drawBackdrop(ctx, time);
    const me = game.players[0];
    const foe = game.players[1];

    // Enemy dalang header: life bar on the left, deck + round on the right,
    // and the enemy hand face-up across the top (values readable).
    drawLifeBar(ctx, 60, 44, 220, foe.life, 20, 'DALANG LAWAN', true);
    text(ctx, `Deck: ${foe.deck.length}`, 1220, 30, 14, PALETTE.muted, 'right');
    text(ctx, `Ronde ${game.round}`, 1220, 52, 14, PALETTE.muted, 'right');
    foe.hand.forEach((card, i) => {
      const r = miniCardRect(i, foe.hand.length);
      drawCard(ctx, card, r.x, r.y, r.w, r.h, { mini: true });
    });

    // Lane slots: a faint lane number marks an empty slot.
    for (let lane = 0; lane < 3; lane += 1) {
      for (const player of [1, 0]) {
        const r = laneRect(player, lane);
        const isTarget = ui.selected >= 0 && player === 0 && !game.players[0].lanes[lane];
        ctx.save();
        roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fillStyle = isTarget ? 'rgba(247,201,72,0.25)' : 'rgba(0,0,0,0.28)';
        ctx.fill();
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = isTarget ? GOLD : 'rgba(245,233,200,0.35)';
        ctx.stroke();
        ctx.restore();
        if (!game.players[player].lanes[lane]) {
          text(ctx, String(lane + 1), r.x + r.w / 2, r.y + r.h / 2, 30, 'rgba(60,40,16,0.35)');
        }
      }
      const a = foe.lanes[lane];
      const b = me.lanes[lane];
      if (a) {
        const r = laneRect(1, lane);
        drawCard(ctx, a, r.x, r.y, r.w, r.h);
      }
      if (b) {
        const r = laneRect(0, lane);
        drawCard(ctx, b, r.x, r.y, r.w, r.h);
      }
      // A clash marker when both sides hold a lane.
      if (a && b) {
        text(ctx, '⚔', LAYOUT.laneCenters[lane], 308, 26, '#ff8a7a');
      }
    }

    // Your header: life, energy, and score.
    drawLifeBar(ctx, 60, 560, 220, me.life, 20, 'KAMU', true);
    drawEnergy(ctx, 380, 560, me.energy, me.maxEnergy);
    text(ctx, `Skor: ${me.damageDealt} damage  •  Kartu dihancurkan: ${me.destroyed}`, 1220, 560, 14, PALETTE.muted, 'right');

    // Your hand.
    me.hand.forEach((card, i) => {
      const r = handCardRect(i, me.hand.length);
      const affordable = card.cost <= me.energy && game.turn === 0;
      drawCard(ctx, card, r.x, r.y - (ui.selected === i ? 14 : 0), r.w, r.h, {
        selected: ui.selected === i,
        dimmed: !affordable,
      });
    });

    // End Turn button.
    const b = endTurnRect();
    const canEnd = game.turn === 0 && game.phase === 'play';
    ctx.save();
    if (!canEnd) ctx.globalAlpha = 0.45;
    ctx.fillStyle = canEnd ? PALETTE.endTurn : '#5a4a2a';
    roundRect(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    text(ctx, 'AKHIRI ▶', b.x + b.w / 2, b.y + b.h / 2 + 1, 19, PALETTE.endTurnText);
    ctx.restore();
    text(ctx, 'Spasi = akhiri giliran', b.x + b.w / 2, b.y + b.h + 18, 12, PALETTE.muted);

    // The latest event line, under the table.
    if (game.log.length > 0) {
      text(ctx, game.log[game.log.length - 1], 640, 524, 14, PALETTE.text, 'center', 'normal');
    }

    // Floating damage numbers and confetti.
    ui.floaters.forEach((f) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
      text(ctx, f.text, f.x, f.y - f.t * 40, 26, f.color);
      ctx.restore();
    });
    ui.confetti.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.t / 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y + p.t * 90, 8, 12);
      ctx.restore();
    });
    if (game.phase === 'over') drawOver(game, wins, time);
  }

  function drawOver(game, wins, time) {
    const won = game.winner === 0;
    ctx.save();
    ctx.fillStyle = won ? 'rgba(20,40,10,0.82)' : 'rgba(40,8,8,0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.restore();
    drawGunungan(ctx, 640, 200, 40, won ? GOLD : '#8a2f2f');
    text(ctx, won ? 'MENANG!' : 'KALAH!', 640, 300, 84, won ? GOLD : '#ff8a7a');
    text(
      ctx,
      won ? 'Layar wayang milikmu, Dalang. Lawanmu tunduk.' : 'Dalang lawan merebut layar. Coba lagi, Dalang.',
      640,
      372,
      20,
      PALETTE.text,
      'center',
      'normal',
    );
    const me = game.players[0];
    text(ctx, `Ronde: ${game.round}   •   Damage: ${me.damageDealt}   •   Kartu dihancurkan: ${me.destroyed}`, 640, 420, 17, PALETTE.muted, 'center', 'normal');
    text(ctx, `Total kemenanganmu: ${wins}`, 640, 452, 17, GOLD);
    const r = restartRect();
    ctx.fillStyle = PALETTE.endTurn;
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    text(ctx, 'MAIN LAGI  ↻', r.x + r.w / 2, r.y + r.h / 2 + 1, 22, PALETTE.endTurnText);
    text(ctx, 'Tekan R atau SPASI untuk duel baru', 640, 622, 15, PALETTE.muted, 'center', 'normal');
  }

  return {
    draw(screen, game, ui, wins, time) {
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      if (screen === SCREEN_TITLE) drawTitle(game, wins, time);
      else drawTable(game, ui, wins, time);
    },
  };
}
