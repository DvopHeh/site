function isLateNight(): boolean {
  const now = new Date();
  const hour = now.getHours();
  
  return hour >= 1 && hour < 7;
}

function showLateNightMessage() {
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '20px';
  popup.style.right = '20px';
  popup.style.background = 'var(--color-surface-alt)';
  popup.style.border = '2px solid var(--color-border)';
  popup.style.borderRadius = '12px';
  popup.style.padding = '16px 20px';
  popup.style.color = 'var(--color-text)';
  popup.style.fontSize = '14px';
  popup.style.fontFamily = 'var(--font-main)';
  popup.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
  popup.style.zIndex = '9999';
  popup.style.cursor = 'pointer';
  popup.style.maxWidth = '300px';
  popup.style.opacity = '0';
  popup.style.transform = 'translateY(-10px)';
  popup.style.transition = 'all 0.3s ease';
  
  const messages = [
    "🌙 Go to sleep! It's past your bedtime",
    "😴 Why are you still awake? Get some rest!",
    "🦉 Only night owls and vampires are up this late",
    "💤 Your sleep schedule is calling for help",
    "🌛 Time to close the laptop and count sheep",
    "😵‍💫 Your eyes need a break from the screen",
    "🛌 Your bed is feeling lonely without you"
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  popup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${randomMessage}</span>
      <span style="font-size: 12px; opacity: 0.7;">×</span>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(0)';
  }, 100);
  
  popup.addEventListener('click', () => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 300);
  });
  
  setTimeout(() => {
    if (document.body.contains(popup)) {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (document.body.contains(popup)) {
          document.body.removeChild(popup);
        }
      }, 300);
    }
  }, 8000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLateNight()) {
    setTimeout(() => {
      showLateNightMessage();
    }, 2000);
  }
});