// Wayang Clash — the cards. Twelve original wayang heroes and monsters in four
// suits. A suit is told apart by colour AND by its glyph shape, never by text
// alone: sword (Ksatria), crescent moon (Punakawan), star (Dewa), horned mask
// (Raksasa). Every card carries ATK / DEF / COST and one on-play power.

export const SUITS = {
  ksatria: { name: 'Ksatria', color: '#d64545', dark: '#7e2222', glyph: 'sword' },
  punakawan: { name: 'Punakawan', color: '#2aa198', dark: '#145550', glyph: 'moon' },
  dewa: { name: 'Dewa', color: '#d4a017', dark: '#7d5f0a', glyph: 'star' },
  raksasa: { name: 'Raksasa', color: '#8e44ad', dark: '#4e2560', glyph: 'horn' },
};

/**
 * power: what happens the moment the card is played.
 *  strike1  — 1 damage to the enemy dalang's life.
 *  strike2  — 2 damage to the enemy dalang's life.
 *  splash1  — 1 damage to every enemy card on the table.
 *  random1  — 1 damage to one random enemy card on the table.
 *  heal2    — restore 2 of your own life.   heal3 — restore 3.
 *  draw1    — draw a card.
 *  energy1  — +1 energy this turn.
 *  buff2    — this card gains +2 DEF.
 */
export const CARDS = [
  { id: 'arjuna', name: 'Arjuna', suit: 'ksatria', atk: 4, def: 3, cost: 3, power: 'strike1', text: 'Panah Sakti: 1 damage ke dalang.' },
  { id: 'bima', name: 'Bima', suit: 'ksatria', atk: 5, def: 4, cost: 4, power: 'splash1', text: 'Gada: 1 damage ke semua kartu.' },
  { id: 'rama', name: 'Rama', suit: 'ksatria', atk: 3, def: 5, cost: 3, power: 'heal2', text: 'Panah Api: pulihkan 2 nyawa.' },
  { id: 'semar', name: 'Semar', suit: 'punakawan', atk: 2, def: 6, cost: 3, power: 'energy1', text: 'Wejangan: +1 energi giliran ini.' },
  { id: 'gareng', name: 'Gareng', suit: 'punakawan', atk: 3, def: 2, cost: 2, power: 'draw1', text: 'Tawa: ambil 1 kartu.' },
  { id: 'petruk', name: 'Petruk', suit: 'punakawan', atk: 2, def: 3, cost: 2, power: 'random1', text: 'Lincah: 1 damage kartu acak.' },
  { id: 'gatotkaca', name: 'Gatotkaca', suit: 'dewa', atk: 6, def: 5, cost: 5, power: 'buff2', text: 'Otot Kawat: kartu ini +2 DEF.' },
  { id: 'hanoman', name: 'Hanoman', suit: 'dewa', atk: 4, def: 4, cost: 4, power: 'draw1', text: 'Terbang: ambil 1 kartu.' },
  { id: 'sinta', name: 'Sinta', suit: 'dewa', atk: 2, def: 4, cost: 2, power: 'heal3', text: 'Doa: pulihkan 3 nyawa.' },
  { id: 'rahwana', name: 'Rahwana', suit: 'raksasa', atk: 5, def: 5, cost: 5, power: 'splash1', text: '10 Kepala: damage semua kartu.' },
  { id: 'kumbakarna', name: 'Kumbakarna', suit: 'raksasa', atk: 6, def: 6, cost: 6, power: 'strike2', text: 'Tidur Panjang: 2 damage ke dalang.' },
  { id: 'kala', name: 'Kala', suit: 'raksasa', atk: 4, def: 3, cost: 3, power: 'random1', text: 'Kutukan: 1 damage kartu acak.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** A 20-card deck: two copies of each common, one of each legend. */
export const DECK_LIST = [
  'arjuna', 'arjuna', 'bima', 'bima', 'rama', 'rama',
  'gareng', 'gareng', 'petruk', 'petruk', 'hanoman', 'hanoman',
  'sinta', 'sinta', 'kala', 'kala',
  'semar', 'gatotkaca', 'rahwana', 'kumbakarna',
];

/** A fresh card instance on the table or in a hand (DEF is its health). */
export function makeCard(defId, uid) {
  const def = CARD_BY_ID[defId];
  return {
    uid,
    defId,
    name: def.name,
    suit: def.suit,
    atk: def.atk,
    def: def.def,
    maxDef: def.def,
    cost: def.cost,
    power: def.power,
    text: def.text,
  };
}
