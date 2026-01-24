<script lang="ts">
	let themeIcon = $state('bi-sun-fill');

	function toggleTheme() {
		const currentTheme = document.documentElement.getAttribute('data-theme');
		const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
		
		document.documentElement.setAttribute('data-theme', newTheme);
		localStorage.setItem('theme', newTheme);
		
		themeIcon = newTheme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill';
	}

	$effect(() => {
		// On mount, sync icon with current theme
		if (typeof window !== 'undefined') {
			const currentTheme = document.documentElement.getAttribute('data-theme');
			themeIcon = currentTheme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill';
		}
	});
</script>

<nav id="navbar">
	<a id="logo" href="/">
		<span>What an absolutely useless site.</span>
	</a>
	<div style="display: flex; align-items: center; gap: 0.5rem;">
		<ul>
			<li><a href="/about">About The Page</a></li>
			<li><a href="/blog">Blog</a></li>
		</ul>
		<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" onclick={toggleTheme}>
			<i class="bi {themeIcon}" id="theme-icon"></i>
		</button>
	</div>
</nav>
