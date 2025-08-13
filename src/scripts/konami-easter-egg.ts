let keysPressed: string[] = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
let isRetroMode = false;

function activateRetroMode() {
  if (isRetroMode) return;
  
  isRetroMode = true;
  const root = document.documentElement;
  
  root.setAttribute('data-theme', 'gameboy');
  
  document.body.style.fontFamily = 'monospace';
  document.body.style.imageRendering = 'pixelated';
  document.body.style.filter = 'contrast(1.2) saturate(1.5)';
  
  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    const element = el as HTMLElement;
    element.style.textShadow = '2px 2px 0px #000000';
    element.style.borderRadius = '0px';
  });
  
  const retroNotif = document.createElement('div');
  retroNotif.innerHTML = '🕹️ GAME BOY MODE ACTIVATED';
  retroNotif.style.position = 'fixed';
  retroNotif.style.top = '50%';
  retroNotif.style.left = '50%';
  retroNotif.style.transform = 'translate(-50%, -50%)';
  retroNotif.style.background = '#0f380f';
  retroNotif.style.color = '#9bbc0f';
  retroNotif.style.padding = '20px';
  retroNotif.style.border = '2px solid #9bbc0f';
  retroNotif.style.fontFamily = 'monospace';
  retroNotif.style.fontSize = '18px';
  retroNotif.style.zIndex = '10000';
  retroNotif.style.boxShadow = '0 0 20px #9bbc0f';
  
  document.body.appendChild(retroNotif);
  
  setTimeout(() => {
    document.body.removeChild(retroNotif);
  }, 3000);
  
  setTimeout(() => {
    location.reload();
  }, 10000);
}

document.addEventListener('keydown', (e) => {
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
    activateRetroMode();
    keysPressed = [];
  }
});