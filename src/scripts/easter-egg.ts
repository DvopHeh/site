let clickCount = 0;
let lastClickTime = 0;

const funnyMessages = [
  "Fortnite Balls, I'm gay I like boys",
  "Works on my machine ¯\\_(ツ)_/¯",
  "Powered by Stack Overflow",
  "TODO: pay yo momma a visit",
  "It's not a bug, it's a feature!",
  "Held together with Tears, Hopes and Dreams",
  "May contain traces of Bolognese",
  "Warranty void if sealed",
  "Side effects may include: Balls"
];

const originalText = "This Site is and forever will be <strong>WIP</strong>";

function handleWipClick() {
  const currentTime = Date.now();
  
  if (currentTime - lastClickTime > 500) {
    clickCount = 0;
  }
  
  clickCount++;
  lastClickTime = currentTime;
  
  if (clickCount >= 3) {
    const wipElement = document.querySelector('.landing-wip');
    if (wipElement) {
      const randomIndex = Math.floor(Math.random() * funnyMessages.length);
      wipElement.innerHTML = funnyMessages[randomIndex];
      
      setTimeout(() => {
        wipElement.innerHTML = originalText;
      }, 3000);
    }
    
    clickCount = 0;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const wipElement = document.querySelector('.landing-wip');
  
  if (wipElement) {
    wipElement.addEventListener('click', handleWipClick);
    wipElement.style.cursor = 'pointer';
  }
});