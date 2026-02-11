const DEFAULT_KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
];

interface KonamiOptions {
  onMatch: () => void;
  code?: string[];
  swipeThreshold?: number;
  swipeResetMs?: number;
}

export function setupKonamiListeners(options: KonamiOptions): () => void {
  const {
    onMatch,
    code = DEFAULT_KONAMI_CODE,
    swipeThreshold = 30,
    swipeResetMs = 3000,
  } = options;

  let keyIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let swipeSequence: string[] = [];
  let swipeResetTimer: ReturnType<typeof setTimeout> | null = null;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.code === code[keyIndex]) {
      keyIndex++;
      if (keyIndex === code.length) {
        onMatch();
        keyIndex = 0;
      }
      return;
    }

    keyIndex = 0;
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    let direction: string | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > swipeThreshold) {
        direction = dx > 0 ? "ArrowRight" : "ArrowLeft";
      }
    } else if (Math.abs(dy) > swipeThreshold) {
      direction = dy > 0 ? "ArrowDown" : "ArrowUp";
    }

    if (!direction) {
      return;
    }

    swipeSequence.push(direction);
    if (swipeResetTimer) {
      clearTimeout(swipeResetTimer);
    }

    swipeResetTimer = setTimeout(() => {
      swipeSequence = [];
    }, swipeResetMs);

    if (swipeSequence.length > code.length) {
      swipeSequence.shift();
    }

    if (swipeSequence.length !== code.length) {
      return;
    }

    for (let i = 0; i < code.length; i++) {
      if (swipeSequence[i] !== code[i]) {
        return;
      }
    }

    onMatch();
    swipeSequence = [];
  };

  window.addEventListener("keydown", handleKeydown);
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchend", handleTouchEnd);

  return () => {
    window.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchend", handleTouchEnd);
    if (swipeResetTimer) {
      clearTimeout(swipeResetTimer);
    }
  };
}
