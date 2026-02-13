<script lang="ts">
	let themeIcon = $state('bi-sun-fill');
	let isSiteStuffOpen = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

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

	function openSiteStuff() {
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
		isSiteStuffOpen = true;
	}

	function closeSiteStuff() {
		if (closeTimer) {
			clearTimeout(closeTimer);
		}
		closeTimer = setTimeout(() => {
			isSiteStuffOpen = false;
			closeTimer = null;
		}, 180);
	}

	function toggleSiteStuff() {
		isSiteStuffOpen = !isSiteStuffOpen;
	}
</script>

<nav id="navbar">
	<a id="logo" href="/">
		<span>What an absolutely useless site.</span>
	</a>
	<div class="nav-controls">
		<ul>
			<li><a href="/blog">Blog</a></li>
			<li class="nav-dropdown-item" onmouseenter={openSiteStuff} onmouseleave={closeSiteStuff}>
				<div class="nav-dropdown">
					<button
						type="button"
						class="nav-dropdown-trigger"
						aria-expanded={isSiteStuffOpen}
						aria-haspopup="true"
						onclick={toggleSiteStuff}
					>
						<span>Site Stuff</span>
						<span class="nav-dropdown-arrow" class:is-open={isSiteStuffOpen} aria-hidden="true">▾</span>
					</button>
					{#if isSiteStuffOpen}
						<div class="nav-dropdown-menu">
						<a href="/about">About</a>
						<a href="/status">API Status</a>
					</div>
					{/if}
				</div>
			</li>
		</ul>
		<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" onclick={toggleTheme}>
			<i class="bi {themeIcon}" id="theme-icon"></i>
		</button>
	</div>
</nav>
