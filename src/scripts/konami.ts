/**
 * Konami Code Plugin
 * 
 * Reveals a hidden element when the Konami Code is entered:
 * ↑ ↑ ↓ ↓ ← → ← → B A
 */

export interface KonamiOptions {
  /** CSS selector for the element to reveal */
  targetSelector: string;
  /** Optional callback when code is entered successfully */
  onSuccess?: () => void;
  /** How long before the sequence resets (ms) */
  resetTimeout?: number;
}

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA'
];

export function initKonami(options: KonamiOptions): void {
  const { targetSelector, onSuccess, resetTimeout = 2000 } = options;

  let currentIndex = 0;
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  // Hide the target element initially
  const targetElement = document.querySelector<HTMLElement>(targetSelector);
  if (targetElement) {
    targetElement.style.display = 'none';
    targetElement.style.opacity = '0';
    targetElement.style.transition = 'opacity 0.3s ease-in-out';
  }

  function resetSequence(): void {
    currentIndex = 0;
  }

  function handleKeydown(event: KeyboardEvent): void {
    // Clear any existing reset timer
    if (resetTimer) {
      clearTimeout(resetTimer);
    }

    // Check if the pressed key matches the expected key in the sequence
    if (event.code === KONAMI_SEQUENCE[currentIndex]) {
      currentIndex++;

      // Check if the full sequence is complete
      if (currentIndex === KONAMI_SEQUENCE.length) {
        // Success! Reveal the element
        if (targetElement) {
          targetElement.style.display = '';
          // Trigger reflow for animation
          void targetElement.offsetHeight;
          targetElement.style.opacity = '1';
        }

        // Call success callback if provided
        onSuccess?.();

        // Reset for potential future use
        resetSequence();

        // Remove the listener (only need to enter once per page load)
        document.removeEventListener('keydown', handleKeydown);
        return;
      }
    } else {
      // Wrong key - reset the sequence
      resetSequence();
    }

    // Set a reset timer so sequence resets if user is too slow
    resetTimer = setTimeout(resetSequence, resetTimeout);
  }

  document.addEventListener('keydown', handleKeydown);
}

// Auto-initialize if script is loaded directly (not imported as module)
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Look for elements with data-konami attribute
    const konamiTargets = document.querySelectorAll<HTMLElement>('[data-konami]');
    
    konamiTargets.forEach((element) => {
      element.style.display = 'none';
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.3s ease-in-out';
    });

    if (konamiTargets.length > 0) {
      initKonami({
        targetSelector: '[data-konami]',
        onSuccess: () => {
          console.log('🎮 Konami Code activated!');
        }
      });
    }
  });
}

export default initKonami;
