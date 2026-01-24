<script lang="ts">
	let visible = $state(false);

	const defaultColors = {
		primary: '#903cff',
		accent: '#d1a3ff',
		border: '#4a00aa',
		bg: '#000000',
		surface: '#61616130',
		text: '#ffffff',
		textMuted: '#ffffff',
		link: '#a259ff',
		linkHover: '#814cb6'
	};

	let colors = $state({ ...defaultColors });

	function updateColor(variable: string, value: string) {
		document.documentElement.style.setProperty(`--color-${variable}`, value);
	}

	function resetColors() {
		colors = { ...defaultColors };
		Object.entries(defaultColors).forEach(([key, value]) => {
			const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			document.documentElement.style.setProperty(`--color-${cssVar}`, value);
		});
	}

	function saveColors() {
		localStorage.setItem('debug-colors', JSON.stringify(colors));
	}

	function close() {
		visible = false;
	}

	// Toggle with Ctrl+D
	if (typeof window !== 'undefined') {
		window.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.key === 'd') {
				e.preventDefault();
				visible = !visible;
			}
		});
	}
</script>

<div id="debug-menu" class="debug-menu" class:visible>
	<div class="debug-header">
		<h3>🐛 Debug Mode</h3>
		<button onclick={close}>×</button>
	</div>
	<div class="debug-content">
		<div class="debug-section">
			<label>Primary Color:</label>
			<input type="color" bind:value={colors.primary} oninput={() => updateColor('primary', colors.primary)} />
		</div>
		<div class="debug-section">
			<label>Accent Color:</label>
			<input type="color" bind:value={colors.accent} oninput={() => updateColor('accent', colors.accent)} />
		</div>
		<div class="debug-section">
			<label>Border Color:</label>
			<input type="color" bind:value={colors.border} oninput={() => updateColor('border', colors.border)} />
		</div>
		<div class="debug-section">
			<label>Background Color:</label>
			<input type="color" bind:value={colors.bg} oninput={() => updateColor('bg', colors.bg)} />
		</div>
		<div class="debug-section">
			<label>Text Color:</label>
			<input type="color" bind:value={colors.text} oninput={() => updateColor('text', colors.text)} />
		</div>
		<div class="debug-section">
			<label>Link Color:</label>
			<input type="color" bind:value={colors.link} oninput={() => updateColor('link', colors.link)} />
		</div>
		<div class="debug-actions">
			<button onclick={resetColors}>Reset Colors</button>
			<button onclick={saveColors}>Save Colors</button>
		</div>
	</div>
</div>
