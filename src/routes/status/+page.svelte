<script lang="ts">
	import { onMount } from 'svelte';

	type HealthState = 'ok' | 'degraded' | 'down' | 'skipped';

	interface Check {
		id: string;
		name: string;
		state: HealthState;
		httpStatus: number | null;
		latencyMs: number | null;
		message: string;
	}

	interface StatusPayload {
		generatedAt: string;
		summary: {
			ok: number;
			degraded: number;
			down: number;
			total: number;
		};
		checks: Check[];
		history?: Array<{
			timestamp: string;
			ok: number;
			degraded: number;
			down: number;
			total: number;
		}>;
	}

	let { data } = $props<{ data: { initialStatus: StatusPayload | null } }>();

	let status = $state<StatusPayload | null>(null);
	let loading = $state(false);
	let error = $state('');

	const REFRESH_INTERVAL_MS = 10000;

	$effect(() => {
		if (status == null) {
			status = data.initialStatus;
		}
	});

	function stateClass(state: HealthState): string {
		if (state === 'ok') return 'status-ok';
		if (state === 'degraded') return 'status-degraded';
		if (state === 'down') return 'status-down';
		return 'status-skipped';
	}

	async function refreshStatus() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/status');
			if (!response.ok) {
				error = `Failed to refresh status (${response.status})`;
				return;
			}
			status = await response.json();
		} catch {
			error = 'Network error while refreshing status.';
		} finally {
			loading = false;
		}
	}

	function formatTimestamp(value: string | null | undefined): string {
		if (!value) return 'Unknown';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Unknown';
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function historyBarHeight(point: { ok: number; degraded: number; down: number; total: number }): number {
		if (!point.total) return 8;
		const okRatio = point.ok / point.total;
		return Math.max(8, Math.round(okRatio * 56));
	}

	function historyBarClass(point: { down: number; degraded: number }): string {
		if (point.down > 0) return 'status-down';
		if (point.degraded > 0) return 'status-degraded';
		return 'status-ok';
	}

	onMount(() => {
		const interval = setInterval(() => {
			void refreshStatus();
		}, REFRESH_INTERVAL_MS);

		return () => clearInterval(interval);
	});
</script>

<div class="status-page">
	<div class="status-header">
		<h1 class="landing-title">API Status</h1>
		<button class="status-refresh-btn" onclick={refreshStatus} disabled={loading}>
			{loading ? 'Refreshing...' : 'Refresh now'}
		</button>
	</div>

	{#if error}
		<div class="status-error">{error}</div>
	{/if}

	{#if status}
		<div class="status-summary-grid">
			<div class="status-summary-card">
				<div class="label">Total Checks</div>
				<div class="value">{status.summary.total}</div>
			</div>
			<div class="status-summary-card status-ok">
				<div class="label">OK</div>
				<div class="value">{status.summary.ok}</div>
			</div>
			<div class="status-summary-card status-degraded">
				<div class="label">Degraded</div>
				<div class="value">{status.summary.degraded}</div>
			</div>
			<div class="status-summary-card status-down">
				<div class="label">Down</div>
				<div class="value">{status.summary.down}</div>
			</div>
		</div>

		<p class="status-generated-at">
			Last updated: {formatTimestamp(status.generatedAt)}
		</p>

		{#if status.history && status.history.length > 0}
			<div class="status-history">
				<div class="status-history-title">Last 24h Trend</div>
				<div class="status-history-bars">
					{#each status.history.slice(-48) as point}
						<div
							class="status-history-bar {historyBarClass(point)}"
							style="height: {historyBarHeight(point)}px"
							title="{formatTimestamp(point.timestamp)} • OK: {point.ok}/{point.total}"
						></div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="status-check-grid">
			{#each status.checks as check}
				<div class="status-check-card">
					<div class="status-check-top">
						<h2>{check.name}</h2>
						<span class="status-pill {stateClass(check.state)}">{check.state}</span>
					</div>
					<p class="status-check-message">{check.message}</p>
					<div class="status-check-meta">
						<span>HTTP: {check.httpStatus ?? '—'}</span>
						<span>Latency: {check.latencyMs != null ? `${check.latencyMs} ms` : '—'}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="status-empty">Status data is unavailable.</p>
	{/if}
</div>

<style>
	.status-page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem;
	}

	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.status-refresh-btn {
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-alt);
		color: var(--color-text);
		cursor: pointer;
	}

	.status-refresh-btn:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.status-error {
		margin: 0.5rem 0 1rem;
		padding: 0.75rem;
		border-radius: 8px;
		background: rgba(255, 0, 0, 0.15);
		color: #ff5e5e;
		border: 1px solid rgba(255, 0, 0, 0.3);
	}

	.status-summary-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.status-summary-card {
		padding: 0.85rem;
		border-radius: 10px;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
	}

	.status-summary-card .label {
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.status-summary-card .value {
		font-size: 1.4rem;
		font-weight: 700;
	}

	.status-generated-at {
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.status-history {
		margin-bottom: 1rem;
		padding: 0.85rem;
		border-radius: 10px;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
	}

	.status-history-title {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.45rem;
	}

	.status-history-bars {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: 60px;
	}

	.status-history-bar {
		width: 8px;
		border-radius: 3px 3px 0 0;
		background: var(--color-text-muted);
		opacity: 0.9;
	}

	.status-check-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.status-check-card {
		padding: 0.9rem;
		border-radius: 10px;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		box-shadow: 0 2px 8px 0 rgb(70, 0, 90);
	}

	.status-check-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.status-check-top h2 {
		margin: 0;
		font-size: 1rem;
	}

	.status-pill {
		text-transform: uppercase;
		font-size: 0.72rem;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
	}

	.status-ok {
		color: #9dffa0;
	}

	.status-degraded {
		color: #ffcb7b;
	}

	.status-down {
		color: #ff6a7b;
	}

	.status-skipped {
		color: var(--color-text-muted);
	}

	.status-check-message {
		margin: 0.4rem 0 0.6rem;
		color: var(--color-text-muted);
	}

	.status-check-meta {
		display: flex;
		gap: 1rem;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.status-empty {
		color: var(--color-text-muted);
	}

	@media (max-width: 900px) {
		.status-summary-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.status-check-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 600px) {
		.status-page {
			padding: 1rem;
		}

		.status-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
