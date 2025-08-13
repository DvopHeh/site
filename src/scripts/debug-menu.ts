let debugMenuOpen = false;

// Keyboard listener for Ctrl+Shift+D
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    toggleDebugMenu();
  }
});

function toggleDebugMenu() {
  const menu = document.getElementById('debug-menu');
  debugMenuOpen = !debugMenuOpen;
  
  if (debugMenuOpen) {
    menu!.style.display = 'block';
    loadCurrentColors();
  } else {
    menu!.style.display = 'none';
  }
}

function loadCurrentColors() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  
  // Get current colors and convert to hex
  const primaryColor = style.getPropertyValue('--color-primary').trim();
  const accentColor = style.getPropertyValue('--color-accent').trim();
  const borderColor = style.getPropertyValue('--color-border').trim();
  const bgColor = style.getPropertyValue('--color-bg').trim();
  const surfaceColor = style.getPropertyValue('--color-surface-alt').trim();
  const textColor = style.getPropertyValue('--color-text').trim();
  const textMutedColor = style.getPropertyValue('--color-text-muted').trim();
  const linkColor = style.getPropertyValue('--color-link').trim();
  const linkHoverColor = style.getPropertyValue('--color-link-hover').trim();
  
  // Set color picker values (fallback to defaults if not found)
  (document.getElementById('primary-color') as HTMLInputElement).value = primaryColor || '#903cff';
  (document.getElementById('accent-color') as HTMLInputElement).value = accentColor || '#d1a3ff';
  (document.getElementById('border-color') as HTMLInputElement).value = borderColor || '#4a00aa';
  (document.getElementById('bg-color') as HTMLInputElement).value = bgColor || '#000000';
  (document.getElementById('surface-color') as HTMLInputElement).value = surfaceColor || '#61616130';
  (document.getElementById('text-color') as HTMLInputElement).value = textColor || '#ffffff';
  (document.getElementById('text-muted-color') as HTMLInputElement).value = textMutedColor || '#ffffff';
  (document.getElementById('link-color') as HTMLInputElement).value = linkColor || '#a259ff';
  (document.getElementById('link-hover-color') as HTMLInputElement).value = linkHoverColor || '#814cb6';
}

function updateColors() {
  const root = document.documentElement;
  const primaryColor = (document.getElementById('primary-color') as HTMLInputElement).value;
  const accentColor = (document.getElementById('accent-color') as HTMLInputElement).value;
  const borderColor = (document.getElementById('border-color') as HTMLInputElement).value;
  const bgColor = (document.getElementById('bg-color') as HTMLInputElement).value;
  const surfaceColor = (document.getElementById('surface-color') as HTMLInputElement).value;
  const textColor = (document.getElementById('text-color') as HTMLInputElement).value;
  const textMutedColor = (document.getElementById('text-muted-color') as HTMLInputElement).value;
  const linkColor = (document.getElementById('link-color') as HTMLInputElement).value;
  const linkHoverColor = (document.getElementById('link-hover-color') as HTMLInputElement).value;
  
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-primary-alt', primaryColor);
  root.style.setProperty('--color-accent', accentColor);
  root.style.setProperty('--color-border', borderColor + 'b0');
  root.style.setProperty('--color-bg', bgColor);
  root.style.setProperty('--color-bg-alt', bgColor);
  root.style.setProperty('--color-surface', surfaceColor);
  root.style.setProperty('--color-surface-alt', surfaceColor);
  root.style.setProperty('--color-text', textColor);
  root.style.setProperty('--color-text-muted', textMutedColor);
  root.style.setProperty('--color-link', linkColor);
  root.style.setProperty('--color-link-hover', linkHoverColor);
  
  // Update gradients
  root.style.setProperty('--color-gradient', `linear-gradient(83.21deg, ${primaryColor} 0%, ${accentColor} 100%)`);
  root.style.setProperty('--color-gradient-alt', `linear-gradient(83.21deg, ${accentColor} 0%, ${primaryColor} 100%)`);
}

function resetColors() {
  (document.getElementById('primary-color') as HTMLInputElement).value = '#903cff';
  (document.getElementById('accent-color') as HTMLInputElement).value = '#d1a3ff';
  (document.getElementById('border-color') as HTMLInputElement).value = '#4a00aa';
  (document.getElementById('bg-color') as HTMLInputElement).value = '#000000';
  (document.getElementById('surface-color') as HTMLInputElement).value = '#61616130';
  (document.getElementById('text-color') as HTMLInputElement).value = '#ffffff';
  (document.getElementById('text-muted-color') as HTMLInputElement).value = '#ffffff';
  (document.getElementById('link-color') as HTMLInputElement).value = '#a259ff';
  (document.getElementById('link-hover-color') as HTMLInputElement).value = '#814cb6';
  updateColors();
  localStorage.removeItem('dvop-colors');
}

function saveColors() {
  const colors = {
    primary: (document.getElementById('primary-color') as HTMLInputElement).value,
    accent: (document.getElementById('accent-color') as HTMLInputElement).value,
    border: (document.getElementById('border-color') as HTMLInputElement).value,
    bg: (document.getElementById('bg-color') as HTMLInputElement).value,
    surface: (document.getElementById('surface-color') as HTMLInputElement).value,
    text: (document.getElementById('text-color') as HTMLInputElement).value,
    textMuted: (document.getElementById('text-muted-color') as HTMLInputElement).value,
    link: (document.getElementById('link-color') as HTMLInputElement).value,
    linkHover: (document.getElementById('link-hover-color') as HTMLInputElement).value
  };
  localStorage.setItem('dvop-colors', JSON.stringify(colors));
  alert('Colors saved!');
}

function loadSavedColors() {
  const saved = localStorage.getItem('dvop-colors');
  if (saved) {
    const colors = JSON.parse(saved);
    (document.getElementById('primary-color') as HTMLInputElement).value = colors.primary;
    (document.getElementById('accent-color') as HTMLInputElement).value = colors.accent;
    (document.getElementById('border-color') as HTMLInputElement).value = colors.border;
    (document.getElementById('bg-color') as HTMLInputElement).value = colors.bg || '#000000';
    (document.getElementById('surface-color') as HTMLInputElement).value = colors.surface || '#61616130';
    (document.getElementById('text-color') as HTMLInputElement).value = colors.text || '#ffffff';
    (document.getElementById('text-muted-color') as HTMLInputElement).value = colors.textMuted || '#ffffff';
    (document.getElementById('link-color') as HTMLInputElement).value = colors.link || '#a259ff';
    (document.getElementById('link-hover-color') as HTMLInputElement).value = colors.linkHover || '#814cb6';
    updateColors();
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('close-debug')?.addEventListener('click', toggleDebugMenu);
  document.getElementById('primary-color')?.addEventListener('input', updateColors);
  document.getElementById('accent-color')?.addEventListener('input', updateColors);
  document.getElementById('border-color')?.addEventListener('input', updateColors);
  document.getElementById('bg-color')?.addEventListener('input', updateColors);
  document.getElementById('surface-color')?.addEventListener('input', updateColors);
  document.getElementById('text-color')?.addEventListener('input', updateColors);
  document.getElementById('text-muted-color')?.addEventListener('input', updateColors);
  document.getElementById('link-color')?.addEventListener('input', updateColors);
  document.getElementById('link-hover-color')?.addEventListener('input', updateColors);
  document.getElementById('reset-colors')?.addEventListener('click', resetColors);
  document.getElementById('save-colors')?.addEventListener('click', saveColors);
  
  // Wait a bit for theme system to load, then check if we should load saved colors
  setTimeout(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const hasLightMode = currentTheme === 'light';
    const hasGameBoyMode = currentTheme === 'gameboy';
    
    // Only load saved colors in default dark mode
    if (!hasLightMode && !hasGameBoyMode) {
      loadSavedColors();
    }
  }, 100);
});