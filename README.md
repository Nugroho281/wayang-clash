[![Best Card Game](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/Nugroho281/wayang-clash/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/Nugroho281/wayang-clash/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Wayang Clash — Duel Kartu Dalang

An original Indonesian shadow-puppet card duel for the
[make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).
Two dalang face off across a wayang screen: three lanes, twenty life each,
energy that grows 1→6 per turn, and a 20-card deck of wayang heroes and
monsters — Arjuna, Bima, Semar, Gatotkaca, Rahwana and more — each with
ATK / DEF / COST and one on-play power. Four suits told apart by colour
**and** shape: Ksatria (sword, crimson), Punakawan (crescent, teal),
Dewa (star, gold), Raksasa (horn, violet).

## How to play

1. Play a card into an empty lane — pay its cost with energy.
2. Cards in the same lane trade ATK into each other's DEF; a card facing an
   empty lane hits the enemy dalang's life directly.
3. Reduce the enemy dalang's life from 20 to 0 to win. An empty deck deals
   growing fatigue damage, so every duel ends.

Mouse: click a card, then click a lane. Keyboard: `1-7` select a card,
`Enter` plays it into the first free lane, `Space` ends the turn, `R`
starts a new duel. The AI dalang reads the table — it kills cards it can
kill and blocks lanes that would hit its life — so its choices can be
countered.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

Static files only (`game/`), no network requests, no build step. Sounds are
synthesized live with WebAudio — no audio files. Screenshots are real renders
of the game's own code in headless Chrome (`?shot=title|play|win|loss`).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to the
output dir and writes `dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`.

## Validation

- Full games simulated headless through the real engine (both WIN and LOSS
  reachable; see `game/src/engine.js` + `game/src/ai.js`).
- Played end-to-end in desktop Chrome with zero console errors; the win
  screen and the loss screen were both reached by the autopilot test hook
  (`?autoplay=1`).

Built for make.fun via referral https://make.fun/r/scz7tdtw

---

<sub>Entered on [make.fun](https://make.fun/?ref=scz7tdtw&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
