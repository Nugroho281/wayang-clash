// Wayang Clash — the entrypoint (Node 22, standard library only).
// It hands the game in: copies this repository's game/ and screenshots/ into
// /output (or $MAKEFUN_OUTPUT_DIR when set) and writes /output/dossier.json
// with buildDossier from the vendored make.fun library, so the judge reads
// exactly the files the browser plays. Nothing is installed, nothing is
// fetched: the whole hand-in is a copy plus one generated summary.
//
// Run it locally the same way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, checked here so a bad hand-in fails loudly at home
// instead of silently on the server: at most 4 screenshots, each at most
// 256 KiB; game/ at most 993 entries and 48 MiB in all.
const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 262144;
const MAX_GAME_FILES = 993;
const MAX_GAME_BYTES = 50331648;

function countGameFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countGameFiles(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

function checkInputs() {
  const gameDir = join(repoRoot, 'game');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(join(gameDir, 'index.html'))) throw new Error('game/index.html is missing');
  const game = countGameFiles(gameDir);
  if (game.files > MAX_GAME_FILES) throw new Error(`game/ holds ${game.files} files, over the 993 cap`);
  if (game.bytes > MAX_GAME_BYTES) throw new Error(`game/ is ${game.bytes} bytes, over the 48 MiB cap`);
  if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > MAX_SCREENSHOTS) {
    throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);
  }
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > MAX_SCREENSHOT_BYTES) throw new Error(`${name} is ${size} bytes, over the 256 KiB cap`);
  }
  return { game, shots: shots.length };
}

const checked = checkInputs();

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SCREENSHOT_BYTES },
    game_max_files: MAX_GAME_FILES,
    game_max_bytes: MAX_GAME_BYTES,
    game_path_max_bytes: 1000,
  }),
);

console.log(`wayang-clash: handed in ${checked.game.files} game files, ${checked.shots} screenshots -> ${outDir}`);
