<script lang="ts">
  import { onMount } from "svelte";

  // ============================================
  // WIP BALLS EASTER EGG
  // Triple-click "This Site is WIP" to show funny message
  // ============================================
  const funnyMessages = [
    "Fortnite Balls, I'm gay I like boys",
    "Works on my machine ¯\\_(ツ)_/¯",
    "Powered by Stack Overflow",
    "TODO: pay yo momma a visit",
    "It's not a bug, it's a feature!",
    "Held together with Tears, Hopes and Dreams",
    "May contain traces of Kebab",
    "Warranty void if sealed",
    "Side effects may include: Balls",
  ];
  const originalWipText =
    "This Site is and forever will be <strong>WIP</strong>";
  let wipClickCount = 0;
  let wipLastClickTime = 0;

  function handleWipClick() {
    const currentTime = Date.now();
    if (currentTime - wipLastClickTime > 500) {
      wipClickCount = 0;
    }
    wipClickCount++;
    wipLastClickTime = currentTime;

    if (wipClickCount >= 3) {
      const wipElement = document.querySelector(".landing-wip");
      if (wipElement) {
        const randomIndex = Math.floor(Math.random() * funnyMessages.length);
        wipElement.innerHTML = funnyMessages[randomIndex];
        setTimeout(() => {
          wipElement.innerHTML = originalWipText;
        }, 3000);
      }
      wipClickCount = 0;
    }
  }

  // ============================================
  // SUDO EASTER EGG
  // Type "sudo" anywhere to show terminal message
  // ============================================
  let typedText = "";
  let sudoResetTimer: ReturnType<typeof setTimeout>;

  const sudoMessages = [
    "dvop is not in the sudoers file. This incident will be reported.",
    "Nice try. This isn't actually a terminal.",
    "sudo: command not found (this is a website, genius)",
    "Permission denied. Try asking nicely instead.",
    "Error: Cannot sudo in browser environment",
  ];

  function showSudoMessage() {
    const terminal = document.createElement("div");
    terminal.className = "easter-egg-sudo";
    terminal.innerHTML = `
      <div style="color: #888;">guest@dvop.fyi:~$</div>
      <div style="color: #ff6666; margin-top: 5px;">${sudoMessages[Math.floor(Math.random() * sudoMessages.length)]}</div>
      <div style="color: #888; margin-top: 10px; font-size: 12px;">Click to dismiss</div>
    `;
    document.body.appendChild(terminal);

    setTimeout(() => {
      terminal.style.opacity = "1";
      terminal.style.transform = "translateY(0)";
    }, 100);

    const dismiss = () => {
      terminal.style.opacity = "0";
      terminal.style.transform = "translateY(20px)";
      setTimeout(() => terminal.remove(), 300);
    };

    terminal.addEventListener("click", dismiss);
    setTimeout(dismiss, 5000);
  }

  function handleKeydownForSudo(e: KeyboardEvent) {
    if (e.key.length === 1) {
      typedText += e.key.toLowerCase();
    }
    if (sudoResetTimer) clearTimeout(sudoResetTimer);
    sudoResetTimer = setTimeout(() => (typedText = ""), 2000);

    if (typedText.includes("sudo")) {
      showSudoMessage();
      typedText = "";
    }
    if (typedText.length > 20) {
      typedText = typedText.slice(-10);
    }
  }

  // ============================================
  // LATE NIGHT EASTER EGG
  // Show "go to sleep" message between 1-7 AM
  // ============================================
  const lateNightMessages = [
    "🌙 Go to sleep! It's past your bedtime",
    "😴 Why are you still awake? Get some rest!",
    "🦉 Only night owls and vampires are up this late",
    "💤 Your sleep schedule is calling for help",
    "🌛 Time to close the laptop and count sheep",
    "😵‍💫 Your eyes need a break from the screen",
    "🛌 Your bed is feeling lonely without you",
  ];

  function isLateNight(): boolean {
    const hour = new Date().getHours();
    return hour >= 1 && hour < 7;
  }

  function showLateNightMessage() {
    const popup = document.createElement("div");
    popup.className = "easter-egg-latenight";
    popup.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${lateNightMessages[Math.floor(Math.random() * lateNightMessages.length)]}</span>
        <span style="font-size: 12px; opacity: 1;">×</span>
      </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.opacity = "1";
      popup.style.transform = "translate(-50%, -50%)";
    }, 100);

    const dismiss = () => {
      popup.style.opacity = "0";
      popup.style.transform = "translate(-50%, -50%) translateY(-10px)";
      setTimeout(() => popup.remove(), 300);
    };

    popup.addEventListener("click", dismiss);
    setTimeout(dismiss, 8000);
  }

  // ============================================
  // KONAMI CODE EASTER EGG
  // ↑↑↓↓←→←→ activates Game Boy mode (30% chance: boo jumpscare)
  // ============================================
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
  ];
  let keysPressed: string[] = [];
  let isRetroMode = false;

  function activateRetroMode() {
    if (isRetroMode) return;
    isRetroMode = true;

    document.documentElement.setAttribute("data-theme", "gameboy");
    document.body.style.fontFamily = "monospace";
    document.body.style.imageRendering = "pixelated";
    document.body.style.filter = "contrast(1.2) saturate(1.5)";

    document.querySelectorAll("*").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.textShadow = "2px 2px 0px #000000";
        el.style.borderRadius = "0px";
      }
    });

    const retroNotif = document.createElement("div");
    retroNotif.className = "easter-egg-konami";
    retroNotif.innerHTML = "🕹️ Konami code is real!!";
    document.body.appendChild(retroNotif);

    setTimeout(() => retroNotif.remove(), 3000);
    setTimeout(() => location.reload(), 10000);
  }

  function showBooJumpscare() {
    const audio = new Audio("/sounds/bgsounds.mp3");
    audio.play().catch(() => {}); // Ignore autoplay errors

    const img = document.createElement("img");
    img.src = "/images/boo.png";
    img.alt = "Boo";
    img.className = "easter-egg-boo";
    document.body.appendChild(img);

    setTimeout(() => img.remove(), 2000);
  }

  function handleKeydownForKonami(e: KeyboardEvent) {
    keysPressed.push(e.key);
    if (keysPressed.length > konamiCode.length) {
      keysPressed.shift();
    }

    let matches = true;
    for (let i = 0; i < konamiCode.length; i++) {
      if (keysPressed[i] !== konamiCode[i]) {
        matches = false;
        break;
      }
    }

    if (matches && keysPressed.length === konamiCode.length) {
      if (Math.random() <= 0.3) {
        showBooJumpscare();
      } else {
        activateRetroMode();
      }
      keysPressed = [];
    }
  }

  // ============================================
  // MOUNT ALL EASTER EGGS
  // ============================================
  onMount(() => {
    // Setup WIP click listener
    const wipElement = document.querySelector(".landing-wip");
    if (wipElement) {
      wipElement.addEventListener("click", handleWipClick);
      (wipElement as HTMLElement).style.cursor = "pointer";
    }

    // Setup sudo keyboard listener
    document.addEventListener("keydown", handleKeydownForSudo);

    // Setup Konami code listener
    document.addEventListener("keydown", handleKeydownForKonami);

    // Show late night message if applicable
    if (isLateNight()) {
      setTimeout(showLateNightMessage, 2000);
    }

    return () => {
      wipElement?.removeEventListener("click", handleWipClick);
      document.removeEventListener("keydown", handleKeydownForSudo);
      document.removeEventListener("keydown", handleKeydownForKonami);
    };
  });
</script>

<style>
  :global(.easter-egg-sudo) {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #000000;
    color: #00ff00;
    font-family: monospace;
    padding: 15px;
    border: 1px solid #333333;
    border-radius: 4px;
    font-size: 14px;
    min-width: 400px;
    z-index: 9999;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  :global(.easter-egg-latenight) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateY(-10px);
    background: var(--color-surface-alt);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 16px 20px;
    color: var(--color-text);
    font-size: 14px;
    font-family: var(--font-main);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    z-index: 9999;
    cursor: pointer;
    max-width: 300px;
    opacity: 0;
    transition: all 0.3s ease;
  }

  :global(.easter-egg-konami) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0f380f;
    color: #9bbc0f;
    padding: 20px;
    border: 2px solid #9bbc0f;
    font-family: monospace;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 0 20px #9bbc0f;
  }

  :global(.easter-egg-boo) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
  }
</style>
