// Wayang Clash — keyboard and mouse input. The renderer owns the geometry, so
// this file only collects raw actions: a bitmask of keys pressed since the last
// frame, the digits 1-7 for hand cards, and a queue of clicks in logical
// (1280x720) coordinates, which main.js hit-tests.

export const ACTION_CONFIRM = 1;
export const ACTION_LEFT = 2;
export const ACTION_RIGHT = 4;
export const ACTION_ESC = 8;
export const ACTION_RESTART = 16;
export const ACTION_END = 32;

export function createInput(canvas, toLogical) {
  let actions = 0;
  let digit = -1;
  const clicks = [];

  function onKeyDown(event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'Enter':
        actions |= ACTION_CONFIRM;
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'KeyA':
        actions |= ACTION_LEFT;
        break;
      case 'ArrowRight':
      case 'KeyD':
        actions |= ACTION_RIGHT;
        break;
      case 'Escape':
        actions |= ACTION_ESC;
        break;
      case 'KeyR':
        actions |= ACTION_RESTART;
        break;
      case 'KeyE':
        actions |= ACTION_END;
        break;
      default:
        if (/^Digit[1-7]$/.test(event.code)) digit = Number(event.code.slice(5));
        break;
    }
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    clicks.push({ x, y });
    if (toLogical) toLogical(x, y);
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
    takeDigit() {
      const out = digit;
      digit = -1;
      return out;
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
