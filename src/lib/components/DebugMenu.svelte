<script lang="ts">
	import { onMount } from 'svelte';

	let visible = $state(false);

	const defaultColors = {
		primary: '#7a2ce0',
		accent: '#9c6fd1',
		border: '#3a008ab0',
		bg: '#000000',
		surface: '#000000',
		surfaceAlt: '#00000018',
		text: '#e8e8e8',
		textMuted: '#b8b8b8',
		link: '#8a49d9',
		linkHover: '#6b3a9e'
	};

	type ThemeName = 'dark' | 'light' | 'gameboy';

	const presets = {
		default: {
			theme: 'dark',
			colors: { ...defaultColors }
		},
		light: {
			theme: 'light',
			colors: {
				primary: '#e879f9',
				accent: '#c084fc',
				border: '#e879f940',
				bg: '#ffffff',
				surface: '#fdf2f8',
				surfaceAlt: '#ffffff',
				text: '#8b5cf6',
				textMuted: '#374151',
				link: '#e879f9',
				linkHover: '#845ef7'
			}
		},
		gameboy: {
			theme: 'gameboy',
			colors: {
				primary: '#9bbc0f',
				accent: '#8bac0f',
				border: '#9bbc0f',
				bg: '#0f380f',
				surface: '#306230',
				surfaceAlt: '#8bac0f',
				text: '#9bbc0f',
				textMuted: '#8bac0f',
				link: '#9bbc0f',
				linkHover: '#306230'
			}
		},
		amber: {
			theme: 'dark',
			colors: {
				primary: '#ffb000',
				accent: '#ffd166',
				border: '#8a5a00',
				bg: '#1a1100',
				surface: '#261700',
				surfaceAlt: '#3a2600',
				text: '#ffe8b3',
				textMuted: '#c7a96a',
				link: '#ffcc4d',
				linkHover: '#ffdb80'
			}
		},
		ocean: {
			theme: 'dark',
			colors: {
				primary: '#00b4d8',
				accent: '#90e0ef',
				border: '#0077b6',
				bg: '#030b17',
				surface: '#061221',
				surfaceAlt: '#0d1e33',
				text: '#e6f7ff',
				textMuted: '#9ec2d4',
				link: '#48cae4',
				linkHover: '#90e0ef'
			}
		},
		mono: {
			theme: 'dark',
			colors: {
				primary: '#f2f2f2',
				accent: '#bdbdbd',
				border: '#4f4f4f',
				bg: '#0f0f0f',
				surface: '#171717',
				surfaceAlt: '#262626',
				text: '#f5f5f5',
				textMuted: '#a3a3a3',
				link: '#e5e5e5',
				linkHover: '#cfcfcf'
			}
		},
		sunset: {
			theme: 'dark',
			colors: {
				primary: '#ff6b6b',
				accent: '#ffd6a5',
				border: '#9b2c2c',
				bg: '#17090d',
				surface: '#251015',
				surfaceAlt: '#3a1a21',
				text: '#ffe9d6',
				textMuted: '#e0b9a2',
				link: '#ffadad',
				linkHover: '#ffd6a5'
			}
		}
	} as const;

	let colors = $state({ ...defaultColors });

	const colorToCssVar: Record<string, string> = {
		primary: '--color-primary',
		accent: '--color-accent',
		border: '--color-border',
		bg: '--color-bg',
		surface: '--color-surface',
		surfaceAlt: '--color-surface-alt',
		text: '--color-text',
		textMuted: '--color-text-muted',
		link: '--color-link',
		linkHover: '--color-link-hover'
	};

	function updateColor(variable: string, value: string) {
		const cssVar = colorToCssVar[variable];
		if (!cssVar) return;
		document.documentElement.style.setProperty(cssVar, value);

		// Keep related variables in sync for consistent theme rendering.
		if (variable === 'bg') {
			document.documentElement.style.setProperty('--color-bg-alt', value);
			document.documentElement.style.setProperty('--color-bg-base', value);
		}
	}

	function applyPreset(name: keyof typeof presets) {
		const preset = presets[name];
		document.documentElement.setAttribute('data-theme', preset.theme);
		localStorage.setItem('theme', preset.theme);

		colors = { ...preset.colors };
		Object.entries(preset.colors).forEach(([key, value]) => {
			updateColor(key, value);
		});
	}

	function resetColors() {
		applyPreset('default');
	}

	function saveColors() {
		localStorage.setItem('debug-colors', JSON.stringify(colors));
	}

	function close() {
		visible = false;
	}

	function applyColorsFromState(nextColors: typeof defaultColors) {
		colors = { ...nextColors };
		Object.entries(nextColors).forEach(([key, value]) => {
			updateColor(key, value);
		});
	}

	onMount(() => {
		try {
			const stored = localStorage.getItem('debug-colors');
			if (stored) {
				const parsed = JSON.parse(stored) as Partial<typeof defaultColors>;
				const merged = { ...defaultColors, ...parsed };
				applyColorsFromState(merged);
			}
		} catch (error) {
			console.error('Failed to load debug colors:', error);
		}

		// Toggle with Ctrl+D
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === 'd') {
				e.preventDefault();
				visible = !visible;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div id="debug-menu" class="debug-menu" class:visible>
	<div class="debug-header">
		<h3>🐛 Debug Mode</h3>
		<button onclick={close}>×</button>
	</div>
	<div class="debug-content">
		<div class="debug-section">
			<p>Theme Presets:</p>
			<div class="preset-buttons">
				<button type="button" onclick={() => applyPreset('default')}>Default</button>
				<button type="button" onclick={() => applyPreset('light')}>Light</button>
				<button type="button" onclick={() => applyPreset('gameboy')}>Game Boy</button>
				<button type="button" onclick={() => applyPreset('amber')}>Amber</button>
				<button type="button" onclick={() => applyPreset('ocean')}>Ocean</button>
				<button type="button" onclick={() => applyPreset('mono')}>Mono</button>
				<button type="button" onclick={() => applyPreset('sunset')}>Sunset</button>
			</div>
		</div>
		<div class="debug-section">
			<label for="debug-primary">Primary Color:</label>
			<input id="debug-primary" type="color" bind:value={colors.primary} oninput={() => updateColor('primary', colors.primary)} />
		</div>
		<div class="debug-section">
			<label for="debug-accent">Accent Color:</label>
			<input id="debug-accent" type="color" bind:value={colors.accent} oninput={() => updateColor('accent', colors.accent)} />
		</div>
		<div class="debug-section">
			<label for="debug-border">Border Color:</label>
			<input id="debug-border" type="color" bind:value={colors.border} oninput={() => updateColor('border', colors.border)} />
		</div>
		<div class="debug-section">
			<label for="debug-bg">Background Color:</label>
			<input id="debug-bg" type="color" bind:value={colors.bg} oninput={() => updateColor('bg', colors.bg)} />
		</div>
		<div class="debug-section">
			<label for="debug-surface">Surface Color:</label>
			<input id="debug-surface" type="color" bind:value={colors.surface} oninput={() => updateColor('surface', colors.surface)} />
		</div>
		<div class="debug-section">
			<label for="debug-surface-alt">Surface Alt Color:</label>
			<input id="debug-surface-alt" type="color" bind:value={colors.surfaceAlt} oninput={() => updateColor('surfaceAlt', colors.surfaceAlt)} />
		</div>
		<div class="debug-section">
			<label for="debug-text">Text Color:</label>
			<input id="debug-text" type="color" bind:value={colors.text} oninput={() => updateColor('text', colors.text)} />
		</div>
		<div class="debug-section">
			<label for="debug-text-muted">Text Muted Color:</label>
			<input id="debug-text-muted" type="color" bind:value={colors.textMuted} oninput={() => updateColor('textMuted', colors.textMuted)} />
		</div>
		<div class="debug-section">
			<label for="debug-link">Link Color:</label>
			<input id="debug-link" type="color" bind:value={colors.link} oninput={() => updateColor('link', colors.link)} />
		</div>
		<div class="debug-section">
			<label for="debug-link-hover">Link Hover Color:</label>
			<input id="debug-link-hover" type="color" bind:value={colors.linkHover} oninput={() => updateColor('linkHover', colors.linkHover)} />
		</div>
		<div class="debug-actions">
			<button onclick={resetColors}>Reset Colors</button>
			<button onclick={saveColors}>Save Colors</button>
		</div>
	</div>
</div>
