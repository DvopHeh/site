let typedText = '';
let resetTimer: NodeJS.Timeout;

function showSudoMessage() {
  const terminal = document.createElement('div');
  terminal.style.position = 'fixed';
  terminal.style.bottom = '20px';
  terminal.style.left = '20px';
  terminal.style.background = '#000000';
  terminal.style.color = '#00ff00';
  terminal.style.fontFamily = 'monospace';
  terminal.style.padding = '15px';
  terminal.style.border = '1px solid #333333';
  terminal.style.borderRadius = '4px';
  terminal.style.fontSize = '14px';
  terminal.style.minWidth = '400px';
  terminal.style.zIndex = '9999';
  terminal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
  terminal.style.opacity = '0';
  terminal.style.transform = 'translateY(20px)';
  terminal.style.transition = 'all 0.3s ease';
  
  const messages = [
    'dvop is not in the sudoers file. This incident will be reported.',
    'Nice try. This isn\'t actually a terminal.',
    'sudo: command not found (this is a website, genius)',
    'Permission denied. Try asking nicely instead.',
    'Error: Cannot sudo in browser environment'
  ];
  
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  terminal.innerHTML = `
    <div style="color: #888;">guest@dvop.fyi:~$</div>
    <div style="color: #ff6666; margin-top: 5px;">${randomMsg}</div>
    <div style="color: #888; margin-top: 10px; font-size: 12px;">Click to dismiss</div>
  `;
  
  document.body.appendChild(terminal);
  
  setTimeout(() => {
    terminal.style.opacity = '1';
    terminal.style.transform = 'translateY(0)';
  }, 100);
  
  terminal.addEventListener('click', () => {
    terminal.style.opacity = '0';
    terminal.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (document.body.contains(terminal)) {
        document.body.removeChild(terminal);
      }
    }, 300);
  });
  
  setTimeout(() => {
    if (document.body.contains(terminal)) {
      terminal.style.opacity = '0';
      terminal.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if (document.body.contains(terminal)) {
          document.body.removeChild(terminal);
        }
      }, 300);
    }
  }, 5000);
}

document.addEventListener('keydown', (e) => {
  if (e.key.length === 1) {
    typedText += e.key.toLowerCase();
  }
  
  if (resetTimer) {
    clearTimeout(resetTimer);
  }
  
  resetTimer = setTimeout(() => {
    typedText = '';
  }, 2000);
  
  if (typedText.includes('sudo')) {
    showSudoMessage();
    typedText = '';
  }
  
  if (typedText.length > 20) {
    typedText = typedText.slice(-10);
  }
});